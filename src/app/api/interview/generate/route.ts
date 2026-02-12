import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { analyses, interviewQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/ai/gemini";
import { buildInterviewPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { interviewGenerateSchema, validateInput } from "@/lib/security/validators";

/**
 * POST /api/interview/generate
 *
 * Input: { analysisId: string }
 *
 * Logic:
 *   1. Fetch the analysis (missing_keywords, improvements, executive_summary)
 *   2. Send context to Gemini → generate 5 technical + 4 behavioral + 3 situational
 *   3. Save to interview_questions table
 *   4. Return the questions
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limit (AI tier)
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.AI);
        if (rl) return rl;

        // Validate Input
        const body = await req.json();
        const validation = validateInput(body, interviewGenerateSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { analysisId } = validation.data;

        // ── 1. Fetch Analysis ────────────────────────────────────
        const [analysis] = await db
            .select({
                id: analyses.id,
                missingKeywords: analyses.missingKeywords,
                matchedKeywords: analyses.matchedKeywords,
                executiveSummary: analyses.executiveSummary,
                improvements: analyses.improvements,
                compatibilityScore: analyses.compatibilityScore,
            })
            .from(analyses)
            .where(eq(analyses.id, analysisId))
            .limit(1);

        if (!analysis) {
            return NextResponse.json(
                { error: "Analysis not found." },
                { status: 404 }
            );
        }

        // ── 2. Check for existing questions ──────────────────────
        const existing = await db
            .select({ id: interviewQuestions.id })
            .from(interviewQuestions)
            .where(eq(interviewQuestions.analysisId, analysisId))
            .limit(1);

        if (existing.length > 0) {
            // Already generated — return them
            const questions = await db
                .select()
                .from(interviewQuestions)
                .where(eq(interviewQuestions.analysisId, analysisId));

            return NextResponse.json({ questions, fromCache: true });
        }

        // ── 3. Build Prompt & Call Gemini ─────────────────────────
        const missingKeywords = (analysis.missingKeywords as string[]) || [];
        const improvements = (analysis.improvements as { section: string; reasoning: string }[]) || [];
        const redFlags = improvements.map((i) => `${i.section}: ${i.reasoning}`);

        const analysisContext = `
Score: ${analysis.compatibilityScore}/100.
Summary: ${analysis.executiveSummary || "N/A"}.
Matched Skills: ${((analysis.matchedKeywords as string[]) || []).join(", ")}.
    `.trim();

        const prompt = buildInterviewPrompt(analysisContext, missingKeywords, redFlags);

        let rawResponse: string;
        try {
            rawResponse = await generateContent(prompt);
        } catch {
            return NextResponse.json(
                { error: "AI service unavailable. Try again." },
                { status: 503 }
            );
        }

        // ── 4. Parse Response ────────────────────────────────────
        let cleaned = rawResponse.trim();
        // Strip markdown fences
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        let generatedQuestions: {
            question: string;
            category: "technical" | "behavioral" | "situational";
            difficulty: "easy" | "medium" | "hard";
        }[];

        try {
            generatedQuestions = JSON.parse(cleaned);
            if (!Array.isArray(generatedQuestions)) {
                throw new Error("Expected array");
            }
        } catch {
            return NextResponse.json(
                { error: "Failed to parse AI response." },
                { status: 502 }
            );
        }

        // ── 5. Save to Database ──────────────────────────────────
        const insertValues = generatedQuestions.map((q) => ({
            analysisId,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
        }));

        const saved = await db
            .insert(interviewQuestions)
            .values(insertValues)
            .returning();

        return NextResponse.json({ questions: saved, fromCache: false });
    } catch (error) {
        console.error("Interview generate error:", error);
        return NextResponse.json(
            { error: "Failed to generate interview questions." },
            { status: 500 }
        );
    }
}
