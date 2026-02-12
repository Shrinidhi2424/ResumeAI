import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";

/**
 * GET /api/admin/analytics
 *
 * Returns aggregated analytics data for the admin dashboard.
 * SECURITY: Rate limited (ADMIN tier: 20 req/60s) + admin role check
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth + Admin Check ─────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Rate Limit (ADMIN tier: 20 req/60s)
    const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.ADMIN);
    if (rl) return rl;

    // ── 1. Skill Gaps ──────────────────────────────────────
    // Unnest the JSONB missing_keywords arrays and count frequency
    const skillGapsResult = await db.execute(sql`
      SELECT
        keyword,
        COUNT(*)::int AS frequency
      FROM analyses,
        jsonb_array_elements_text(missing_keywords) AS keyword
      WHERE missing_keywords IS NOT NULL
      GROUP BY keyword
      ORDER BY frequency DESC
      LIMIT 20
    `);

    // ── 2. Score Trends (by day) ───────────────────────────
    const scoreTrendsResult = await db.execute(sql`
      SELECT
        DATE_TRUNC('day', created_at)::date AS date,
        ROUND(AVG(compatibility_score), 1)::float AS avg_compatibility,
        ROUND(AVG(ats_score), 1)::float AS avg_ats,
        COUNT(*)::int AS total_analyses
      FROM analyses
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `);

    // ── 3. Overview Stats ──────────────────────────────────
    const [overviewResult] = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM resumes) AS total_resumes,
        (SELECT COUNT(*)::int FROM analyses) AS total_analyses,
        (SELECT ROUND(AVG(compatibility_score), 1)::float FROM analyses) AS avg_score,
        (SELECT ROUND(AVG(ats_score), 1)::float FROM analyses) AS avg_ats_score
    `);

    // ── 4. Department Breakdown ────────────────────────────
    const departmentResult = await db.execute(sql`
      SELECT
        COALESCE(department, 'Unknown') AS department,
        COUNT(*)::int AS student_count
      FROM users
      WHERE role = 'student'
      GROUP BY department
      ORDER BY student_count DESC
      LIMIT 10
    `);

    // ── 5. Score Distribution ──────────────────────────────
    const distributionResult = await db.execute(sql`
      SELECT
        CASE
          WHEN compatibility_score >= 80 THEN 'Excellent (80-100)'
          WHEN compatibility_score >= 60 THEN 'Good (60-79)'
          WHEN compatibility_score >= 40 THEN 'Fair (40-59)'
          WHEN compatibility_score >= 20 THEN 'Poor (20-39)'
          ELSE 'Very Poor (0-19)'
        END AS bucket,
        COUNT(*)::int AS count
      FROM analyses
      WHERE compatibility_score IS NOT NULL
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN 'Excellent (80-100)' THEN 1
          WHEN 'Good (60-79)' THEN 2
          WHEN 'Fair (40-59)' THEN 3
          WHEN 'Poor (20-39)' THEN 4
          ELSE 5
        END
    `);

    return NextResponse.json({
      skillGaps: skillGapsResult,
      scoreTrends: scoreTrendsResult,
      overview: overviewResult,
      departments: departmentResult,
      scoreDistribution: distributionResult,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics." },
      { status: 500 }
    );
  }
}
