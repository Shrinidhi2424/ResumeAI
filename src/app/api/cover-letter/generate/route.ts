import { genAI } from "@/lib/ai/gemini";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resumes, coverLetters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { coverLetterSchema, validateInput } from "@/lib/security/validators";

/**
 * POST /api/cover-letter/generate
 *
 * Streams a cover letter response using the Vercel AI SDK Adapter for Google Generative AI.
 * Uses the shared `genAI` client from @/lib/ai/gemini to ensure correct model and key usage.
 *
 * Body:
 *   - resumeId: UUID of the resume to use
 *   - jobDescription: Target job description text
 *   - companyName: Target company name
 *   - companyNews: Recent company news (optional)
 *   - tone: "professional" | "enthusiastic" | "technical"
 */
export async function POST(req: Request) {
    try {
        // ── Auth ────────────────────────────────────────────────
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        // ── Rate Limit (AI tier: 5 req/60s) ─────────────────
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.AI);
        if (rl) return rl;

        // ── Parse & Validate Body ────────────────────────────
        const body = await req.json();
        const validation = validateInput(body, coverLetterSchema);
        if (!validation.success) {
            return new Response(validation.error, { status: 400 });
        }
        const { resumeId, jobDescription, companyName, tone, companyNews } = validation.data;

        // ── Fetch Resume Text ───────────────────────────────────
        const [resume] = await db
            .select({ parsedText: resumes.parsedText, userId: resumes.userId })
            .from(resumes)
            .where(eq(resumes.id, resumeId))
            .limit(1);

        if (!resume) {
            return new Response("Resume not found.", { status: 404 });
        }

        if (resume.userId !== userId) {
            return new Response("Forbidden.", { status: 403 });
        }

        if (!resume.parsedText) {
            return new Response("Resume has no parsed text.", { status: 422 });
        }

        // ── Build Prompt ────────────────────────────────────────
        const prompt = buildCoverLetterPrompt(
            resume.parsedText,
            jobDescription,
            companyName,
            companyNews || "No recent news available.",
            tone
        );

        // ── Stream Response ─────────────────────────────────────
        // Use the direct client which allows "gemini-2.5-flash" if the account has access.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const streamingResults = await model.generateContentStream(prompt);

        // Convert Gemini stream to web standard ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                let fullText = "";
                const encoder = new TextEncoder();

                try {
                    console.log("Stream started for user:", userId);
                    for await (const chunk of streamingResults.stream) {
                        const chunkText = chunk.text();
                        fullText += chunkText;
                        controller.enqueue(encoder.encode(chunkText));
                    }
                    console.log("Stream complete. Total length:", fullText.length);

                    // Save the completed cover letter to the database
                    await db.insert(coverLetters).values({
                        userId,
                        tone,
                        content: fullText,
                    });

                    controller.close();
                } catch (err) {
                    console.error("Stream error:", err);
                    controller.error(err);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("Cover letter generation error:", error);
        // Return a JSON error response that the client can parse
        return new Response(JSON.stringify({ error: "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
