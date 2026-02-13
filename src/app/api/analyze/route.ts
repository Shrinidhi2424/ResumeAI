import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resumes, jobDescriptions, analyses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/ai/gemini";
import { buildAnalyzePrompt } from "@/lib/ai/prompts";
import { parseAnalysisResponse } from "@/lib/ai/response-parser";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { analyzeSchema, validateInput } from "@/lib/security/validators";

/**
 * POST /api/analyze
 *
 * Accepts JSON body:
 *   - resumeId: UUID of a previously uploaded resume (required)
 *   - jobDescription: Job description text (required)
 *   - companyName: Company name (optional, saved to job_descriptions)
 *   - jobTitle: Job title (optional, saved to job_descriptions)
 *
 * Pipeline:
 *   1. Authenticate user via Clerk
 *   2. Fetch resume's parsed_text from the database
 *   3. Optionally save the job description for reusability
 *   4. Build the analysis prompt and send to Gemini
 *   5. Parse the AI response with strict validation
 *   6. Save structured results to the analyses table
 *   7. Return the full analysis result
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        // ── 1. Auth ────────────────────────────────────────────
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── 1b. Rate Limit (AI tier: 5 req/60s) ──────────────
        const rateLimitResponse = checkRateLimit(
            getRateLimitKey(req, userId),
            RATE_LIMITS.AI
        );
        if (rateLimitResponse) return rateLimitResponse;

        // ── 2. Parse & Validate Request Body ─────────────────
        const body = await req.json();
        const validation = validateInput(body, analyzeSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { resumeId, jobDescription, companyName, jobTitle } = validation.data;

        // ── 3. Fetch Resume Text ───────────────────────────────
        const [resume] = await db
            .select({
                id: resumes.id,
                parsedText: resumes.parsedText,
                userId: resumes.userId,
            })
            .from(resumes)
            .where(eq(resumes.id, resumeId))
            .limit(1);

        if (!resume) {
            return NextResponse.json(
                { error: "Resume not found." },
                { status: 404 }
            );
        }

        // Verify the resume belongs to the requesting user
        if (resume.userId !== userId) {
            return NextResponse.json(
                { error: "You do not have permission to analyze this resume." },
                { status: 403 }
            );
        }

        if (!resume.parsedText || resume.parsedText.trim().length === 0) {
            return NextResponse.json(
                { error: "This resume has no parsed text. Please re-upload." },
                { status: 422 }
            );
        }

        // ── 4. Save Job Description (for reusability) ──────────
        const [savedJD] = await db
            .insert(jobDescriptions)
            .values({
                userId,
                description: jobDescription.trim(),
                companyName: companyName || null,
                jobTitle: jobTitle || null,
            })
            .returning({ id: jobDescriptions.id });

        // ── 5. Build Prompt & Call Gemini ───────────────────────
        const prompt = buildAnalyzePrompt(resume.parsedText, jobDescription);

        let rawResponse: string;
        try {
            rawResponse = await generateContent(prompt);
        } catch (aiError) {
            console.error("Gemini API error (Stack):", aiError);
            const errorMessage = aiError instanceof Error ? aiError.message : "Unknown AI error";
            return NextResponse.json(
                { error: `AI service unavailable: ${errorMessage}` },
                { status: 503 }
            );
        }

        // ── 6. Parse AI Response ───────────────────────────────
        let analysisResult;
        try {
            analysisResult = parseAnalysisResponse(rawResponse);
        } catch (parseError) {
            console.error("AI response parsing error:", parseError);
            return NextResponse.json(
                {
                    error:
                        "Failed to parse AI response. The AI returned an unexpected format. Please try again.",
                },
                { status: 502 }
            );
        }

        // ── 7. Save to Database ────────────────────────────────
        const processingTimeMs = Date.now() - startTime;

        const [savedAnalysis] = await db
            .insert(analyses)
            .values({
                resumeId,
                jdId: savedJD.id,
                compatibilityScore: analysisResult.compatibilityScore,
                atsScore: analysisResult.atsScore,
                matchedKeywords: analysisResult.matchedKeywords,
                missingKeywords: analysisResult.missingKeywords,
                executiveSummary: analysisResult.executiveSummary,
                improvements: analysisResult.improvements,
                processingTimeMs,
            })
            .returning({
                id: analyses.id,
                createdAt: analyses.createdAt,
            });

        // ── 8. Response ────────────────────────────────────────
        return NextResponse.json(
            {
                analysisId: savedAnalysis.id,
                resumeId,
                jdId: savedJD.id,
                ...analysisResult,
                processingTimeMs,
                createdAt: savedAnalysis.createdAt,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Analysis endpoint error:", error);
        return NextResponse.json(
            { error: "Internal server error during analysis." },
            { status: 500 }
        );
    }
}
