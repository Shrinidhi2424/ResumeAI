import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { companyIntel } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/ai/gemini";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { companyEnrichSchema, validateInput } from "@/lib/security/validators";

/**
 * POST /api/company/enrich
 *
 * Input: { companyName: string }
 *
 * Pipeline:
 *   1. Check DB for cached data (< 30 days old)
 *   2. If stale/missing:
 *      a) Fetch news from NewsAPI
 *      b) Generate company profile via Gemini
 *      c) Upsert into company_intel table
 *   3. Return combined data
 */

interface NewsArticle {
    title: string;
    url: string;
    publishedAt: string;
}

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
        const validation = validateInput(body, companyEnrichSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const normalizedName = validation.data.companyName;

        // ── 1. Check Cache ───────────────────────────────────────
        const [cached] = await db
            .select()
            .from(companyIntel)
            .where(eq(companyIntel.companyName, normalizedName))
            .limit(1);

        if (cached) {
            const ageMs = Date.now() - new Date(cached.lastUpdated).getTime();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

            if (ageMs < thirtyDaysMs) {
                return NextResponse.json({ company: cached, fromCache: true });
            }
        }

        // ── 2a. Fetch News from NewsAPI ──────────────────────────
        let newsArticles: { title: string; date: string; url: string }[] = [];

        const newsApiKey = process.env.NEWS_API_KEY;
        if (newsApiKey) {
            try {
                const newsRes = await fetch(
                    `https://newsapi.org/v2/everything?` +
                    new URLSearchParams({
                        q: normalizedName,
                        sortBy: "publishedAt",
                        pageSize: "5",
                        language: "en",
                        apiKey: newsApiKey,
                    }),
                    { next: { revalidate: 86400 } } // cache 1 day
                );

                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    newsArticles = (newsData.articles || [])
                        .slice(0, 5)
                        .map((a: NewsArticle) => ({
                            title: a.title || "Untitled",
                            date: a.publishedAt?.split("T")[0] || "Unknown",
                            url: a.url || "#",
                        }));
                }
            } catch (e) {
                console.warn("NewsAPI fetch failed:", e);
            }
        }

        // ── 2b. Generate Company Profile via Gemini ──────────────
        const profilePrompt = `
You are a professional career advisor and business analyst.

TASK: Provide a concise intelligence report on the company "${normalizedName}" that would help a job applicant prepare for interviews and applications.

CRITICAL: Respond ONLY with valid JSON in this exact structure:
{
  "industry": "e.g., Technology, Finance, Healthcare",
  "headquarters": "City, Country",
  "description": "2-3 sentence company overview focusing on what they do and their market position",
  "glassdoor_rating": <number 1.0-5.0, your best estimate based on public perception>,
  "interview_difficulty": "Easy" | "Medium" | "Hard",
  "tech_stack": ["technology1", "technology2", "...up to 10 items"],
  "culture_keywords": ["e.g., Innovation", "Work-Life Balance", "Fast-Paced", "Remote-First", "...up to 6 items"],
  "employee_count": <estimated number>,
  "why_join": "2-3 sentences on why a candidate should consider this company",
  "interview_tips": "2-3 specific tips for interviewing at this company"
}

Use your training data to provide the most accurate information available.
DO NOT include any text outside the JSON object. DO NOT use markdown formatting.
    `.trim();

        let profile: {
            industry?: string;
            headquarters?: string;
            description?: string;
            glassdoor_rating?: number;
            interview_difficulty?: string;
            tech_stack?: string[];
            culture_keywords?: string[];
            employee_count?: number;
            why_join?: string;
            interview_tips?: string;
        } = {};

        try {
            const rawResponse = await generateContent(profilePrompt);
            let cleaned = rawResponse.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned
                    .replace(/^```(?:json)?\n?/, "")
                    .replace(/\n?```$/, "");
            }
            profile = JSON.parse(cleaned);
        } catch (e) {
            console.error("Gemini company profile error:", e);
            // Continue with partial data
        }

        // ── 3. Upsert to Database ────────────────────────────────
        const companyData = {
            companyName: normalizedName,
            industry: profile.industry || null,
            headquarters: profile.headquarters || null,
            description: profile.description || null,
            glassdoorRating: profile.glassdoor_rating?.toString() || null,
            interviewDifficulty: profile.interview_difficulty || null,
            recentNews: newsArticles.length > 0 ? newsArticles : null,
            techStack: profile.tech_stack || null,
            cultureKeywords: profile.culture_keywords || null,
            employeeCount: profile.employee_count || null,
            lastUpdated: new Date(),
        };

        let saved;
        if (cached) {
            // Update existing
            [saved] = await db
                .update(companyIntel)
                .set(companyData)
                .where(eq(companyIntel.companyName, normalizedName))
                .returning();
        } else {
            // Insert new
            [saved] = await db
                .insert(companyIntel)
                .values(companyData)
                .returning();
        }

        return NextResponse.json({
            company: {
                ...saved,
                whyJoin: profile.why_join || null,
                interviewTips: profile.interview_tips || null,
            },
            fromCache: false,
        });
    } catch (error) {
        console.error("Company enrich error:", error);
        return NextResponse.json(
            { error: "Failed to enrich company data." },
            { status: 500 }
        );
    }
}
