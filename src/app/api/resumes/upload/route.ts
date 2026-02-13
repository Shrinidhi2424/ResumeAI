import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { parsePDF } from "@/lib/pdf/parser";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";

/**
 * POST /api/resumes/upload
 *
 * Accepts multipart/form-data with:
 *   - file: PDF file (required)
 *   - versionName: Custom name for this resume version (optional, defaults to filename)
 *
 * Pipeline:
 *   1. Authenticate user via Clerk
 *   2. Validate the uploaded file (PDF, size limit)
 *   3. Upload to Supabase Storage bucket "resumes"
 *   4. Parse PDF to extract text
 *   5. Insert record into resumes table
 *   6. Return resumeId + parsed metadata
 */
export async function POST(req: NextRequest) {
    try {
        // ── 1. Auth ────────────────────────────────────────────
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── 1b. Rate Limit (UPLOAD tier: 10 req/60s) ─────────
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.UPLOAD);
        if (rl) return rl;

        // ── 2. Parse FormData ──────────────────────────────────
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const rawVersionName = (formData.get("versionName") as string) || undefined;

        // SECURITY: Sanitize version name (trim, length limit)
        const versionName = rawVersionName?.trim().slice(0, 255);

        if (!file) {
            return NextResponse.json(
                { error: "No file provided. Please upload a PDF." },
                { status: 400 }
            );
        }

        // Validate file type (SECURITY: check both MIME and extension)
        const allowedMimes = ["application/pdf"];
        const allowedExts = [".pdf"];
        const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");

        if (!allowedMimes.includes(file.type) || !allowedExts.includes(ext)) {
            return NextResponse.json(
                { error: "Invalid file type. Only PDF files are accepted." },
                { status: 400 }
            );
        }

        // SECURITY: Sanitize filename (prevent path traversal)
        if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
            return NextResponse.json(
                { error: "Invalid file name." },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        // ── 3. Upload to Supabase Storage ──────────────────────
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split(".").pop() || "pdf";
        const storagePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;

        const supabase = createAdminClient();
        const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload file to storage." },
                { status: 500 }
            );
        }

        // Get the public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("resumes").getPublicUrl(storagePath);

        // ── 4. Parse PDF ───────────────────────────────────────
        const parsed = await parsePDF(buffer);

        if (!parsed.text || parsed.text.trim().length === 0) {
            return NextResponse.json(
                {
                    error:
                        "Could not extract text from this PDF. It may be a scanned image. Please upload a text-based PDF.",
                },
                { status: 422 }
            );
        }

        // ── 5. Save to Database ────────────────────────────────
        const resumeName =
            versionName || file.name.replace(`.${fileExtension}`, "");

        const [insertedResume] = await db
            .insert(resumes)
            .values({
                userId,
                versionName: resumeName,
                fileUrl: publicUrl,
                parsedText: parsed.text,
                isStarred: false,
            })
            .returning({
                id: resumes.id,
                versionName: resumes.versionName,
                fileUrl: resumes.fileUrl,
                createdAt: resumes.createdAt,
            });

        // ── 6. Response ────────────────────────────────────────
        return NextResponse.json(
            {
                resumeId: insertedResume.id,
                versionName: insertedResume.versionName,
                fileUrl: insertedResume.fileUrl,
                pageCount: parsed.pageCount,
                textLength: parsed.text.length,
                createdAt: insertedResume.createdAt,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Resume upload error (Stack):", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: `Internal server error: ${errorMessage}` },
            { status: 500 }
        );
    }
}

