import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";

/**
 * GET /api/resumes
 * Returns all resumes for the authenticated user.
 * SECURITY: Rate limited (READ tier: 60 req/60s)
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limit
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.READ);
        if (rl) return rl;

        const userResumes = await db
            .select({
                id: resumes.id,
                versionName: resumes.versionName,
                fileUrl: resumes.fileUrl,
                isStarred: resumes.isStarred,
                createdAt: resumes.createdAt,
            })
            .from(resumes)
            .where(eq(resumes.userId, userId))
            .orderBy(resumes.createdAt);

        return NextResponse.json({ resumes: userResumes });
    } catch (error) {
        console.error("Fetch resumes error:", error);
        return NextResponse.json(
            { error: "Failed to fetch resumes." },
            { status: 500 }
        );
    }
}
