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
import { downloadResumePdf } from "@/lib/supabase/storage";
import { parseFirstPageTextItems } from "@/lib/pdf/parser";
import { generateHeatmap } from "@/lib/pdf/heatmap";
import { scoreKeywordCoverage, type KeywordCoverage } from "@/lib/scoring/keyword-match";
import type { AnalysisResult } from "@/types";

/** Shown (and saved) when Gemini could not produce an analysis. */
const KEYWORD_ONLY_SUMMARY =
    "AI analysis unavailable: showing deterministic keyword match only.";

/** Like AnalysisResult, but scores can be null in keyword-only mode. */
type AnalyzeOutput = Omit<AnalysisResult, "compatibilityScore" | "atsScore"> & {
    compatibilityScore: number | null;
    atsScore: number | null;
};

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
 *   4. Compute deterministic keyword coverage (always)
 *   5. Ask Gemini and parse its JSON; if that fails, fall back to a
 *      keyword-only result built from step 4 (mode: "keyword-only")
 *   6. Build the recruiter-attention heatmap (best effort, page 1 only)
 *   7. Save structured results to the analyses table
 *   8. Return the result with `mode` and `keywordCoverage`
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
                fileUrl: resumes.fileUrl,
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

        // ── 5. Keyword coverage (deterministic, always computed) ──
        const keywordCoverage = scoreKeywordCoverage(resume.parsedText, jobDescription);

        // ── 6. Gemini, with keyword-only fallback ──────────────
        // Any failure here (missing key, API error, unparseable JSON)
        // falls back instead of returning 502/503.
        let analysisResult: AnalyzeOutput;
        let mode: "ai" | "keyword-only";
        try {
            const prompt = buildAnalyzePrompt(resume.parsedText, jobDescription);
            const rawResponse = await generateContent(prompt);
            analysisResult = parseAnalysisResponse(rawResponse);
            mode = "ai";
        } catch (aiError) {
            console.error("Gemini analysis failed, using keyword-only fallback:", aiError);
            analysisResult = buildKeywordOnlyResult(keywordCoverage);
            mode = "keyword-only";
        }

        // ── 7. Heatmap (best effort) ───────────────────────────
        const heatmapData = resume.fileUrl
            ? await buildHeatmapData(resume.fileUrl, analysisResult.matchedKeywords)
            : null;

        // ── 8. Save to Database ────────────────────────────────
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
                heatmapData,
                processingTimeMs,
            })
            .returning({
                id: analyses.id,
                createdAt: analyses.createdAt,
            });

        // ── 9. Response ────────────────────────────────────────
        return NextResponse.json(
            {
                analysisId: savedAnalysis.id,
                resumeId,
                jdId: savedJD.id,
                mode,
                ...analysisResult,
                keywordCoverage,
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

/**
 * Result saved and returned when Gemini is unavailable: the coverage
 * score stands in for the compatibility score, and there is no ATS score.
 */
function buildKeywordOnlyResult(coverage: KeywordCoverage): AnalyzeOutput {
    return {
        compatibilityScore: coverage.score,
        atsScore: null,
        matchedKeywords: coverage.matched,
        missingKeywords: coverage.missing,
        executiveSummary: KEYWORD_ONLY_SUMMARY,
        improvements: [],
        redFlags: [],
        standoutPoints: [],
    };
}

/**
 * Download the resume PDF, read page-1 text positions and score them.
 * Returns null on any failure: a heatmap problem must never fail the analysis.
 */
async function buildHeatmapData(fileUrl: string, matchedKeywords: string[]) {
    try {
        const pdf = await downloadResumePdf(fileUrl);
        const { items, pageWidth, pageHeight } = await parseFirstPageTextItems(pdf);
        const points = generateHeatmap(items, matchedKeywords, pageWidth, pageHeight);
        // Store only what the schema declares (x, y, intensity).
        return points.map(({ x, y, intensity }) => ({ x, y, intensity }));
    } catch (error) {
        console.error("Heatmap generation failed (analysis continues):", error);
        return null;
    }
}
