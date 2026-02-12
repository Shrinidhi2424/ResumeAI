import { streamText } from "ai";
import { google } from "@ai-sdk/google";
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
 * Streams a cover letter response using the Vercel AI SDK.
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
        const { resumeId, jobDescription, companyName, tone } = validation.data;

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

        // ── Build Prompt & Stream ───────────────────────────────
        const prompt = buildCoverLetterPrompt(
            resume.parsedText,
            jobDescription,
            companyName,
            "No recent news available.",
            tone
        );

        const result = streamText({
            model: google("gemini-1.5-pro"),
            prompt,
            async onFinish({ text }) {
                // Save the completed cover letter to the database
                try {
                    await db.insert(coverLetters).values({
                        userId,
                        tone,
                        content: text,
                    });
                } catch (err) {
                    console.error("Failed to save cover letter:", err);
                }
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Cover letter generation error:", error);
        return new Response("Internal server error.", { status: 500 });
    }
}
