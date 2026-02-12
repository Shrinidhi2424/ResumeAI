import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { interviewQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/ai/gemini";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { interviewFeedbackSchema, validateInput } from "@/lib/security/validators";

/**
 * POST /api/interview/feedback
 *
 * Input: { questionId: string, userAnswer: string }
 *
 * Logic:
 *   1. Fetch the question
 *   2. Send question + answer to Gemini for grading
 *   3. Parse score (0-10) and feedback tip
 *   4. Save to interview_questions table
 *   5. Return score + feedback
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
        const validation = validateInput(body, interviewFeedbackSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { questionId, userAnswer } = validation.data;

        // ── 1. Fetch Question ────────────────────────────────────
        const [question] = await db
            .select()
            .from(interviewQuestions)
            .where(eq(interviewQuestions.id, questionId))
            .limit(1);

        if (!question) {
            return NextResponse.json(
                { error: "Question not found." },
                { status: 404 }
            );
        }

        // ── 2. Build Grading Prompt ──────────────────────────────
        const prompt = `
You are an expert interview coach grading a candidate's answer.

INTERVIEW QUESTION:
"${question.question}"

Category: ${question.category}
Difficulty: ${question.difficulty}

CANDIDATE'S ANSWER:
"${userAnswer.trim()}"

TASK: Grade this answer and provide actionable feedback.

GRADING CRITERIA:
- Relevance to the question (30%)
- Depth and specificity (25%)
- Use of examples / STAR method (25%)
- Communication clarity (20%)

CRITICAL: Respond ONLY with valid JSON in this exact structure:
{
  "score": <number 0-10>,
  "feedback": "<1-2 sentence actionable tip>",
  "strengths": "<what they did well, 1 sentence>",
  "improvement": "<specific suggestion, 1 sentence>"
}

DO NOT include any text outside the JSON object.
    `.trim();

        // ── 3. Call Gemini ───────────────────────────────────────
        let rawResponse: string;
        try {
            rawResponse = await generateContent(prompt);
        } catch {
            return NextResponse.json(
                { error: "AI service unavailable." },
                { status: 503 }
            );
        }

        // ── 4. Parse Response ────────────────────────────────────
        let cleaned = rawResponse.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        let result: {
            score: number;
            feedback: string;
            strengths: string;
            improvement: string;
        };

        try {
            result = JSON.parse(cleaned);
            result.score = Math.max(0, Math.min(10, Math.round(result.score)));
        } catch {
            return NextResponse.json(
                { error: "Failed to parse AI feedback." },
                { status: 502 }
            );
        }

        // ── 5. Save to DB ────────────────────────────────────────
        const feedbackText = `${result.feedback} Strengths: ${result.strengths} To improve: ${result.improvement}`;

        await db
            .update(interviewQuestions)
            .set({
                userAnswer: userAnswer.trim(),
                aiFeedback: feedbackText,
                score: result.score,
            })
            .where(eq(interviewQuestions.id, questionId));

        return NextResponse.json({
            questionId,
            score: result.score,
            feedback: result.feedback,
            strengths: result.strengths,
            improvement: result.improvement,
        });
    } catch (error) {
        console.error("Interview feedback error:", error);
        return NextResponse.json(
            { error: "Failed to generate feedback." },
            { status: 500 }
        );
    }
}
