import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import {
    applicationCreateSchema,
    applicationUpdateSchema,
    applicationDeleteSchema,
    validateInput,
} from "@/lib/security/validators";

/**
 * GET /api/applications
 * Returns all applications for the authenticated user.
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

        const userApps = await db
            .select()
            .from(applications)
            .where(eq(applications.userId, userId))
            .orderBy(applications.updatedAt);

        return NextResponse.json({ applications: userApps });
    } catch (error) {
        console.error("Fetch applications error:", error);
        return NextResponse.json(
            { error: "Failed to fetch applications." },
            { status: 500 }
        );
    }
}

/**
 * POST /api/applications
 * Create a new application.
 *
 * SECURITY: Rate limited (CRUD tier: 30 req/60s) + Zod validation
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limit
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.CRUD);
        if (rl) return rl;

        // Validate Input
        const body = await req.json();
        const validation = validateInput(body, applicationCreateSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { companyName, jobTitle, status, resumeId, notes } = validation.data;

        const [app] = await db
            .insert(applications)
            .values({
                userId,
                companyName,
                jobTitle,
                status: status || "wishlist",
                resumeId: resumeId || null,
                notes: notes || null,
                appliedDate: status === "applied" ? new Date().toISOString().split("T")[0] : null,
            })
            .returning();

        return NextResponse.json({ application: app }, { status: 201 });
    } catch (error) {
        console.error("Create application error:", error);
        return NextResponse.json(
            { error: "Failed to create application." },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/applications
 * Update an application's status (for Kanban drag-and-drop).
 *
 * SECURITY: Rate limited (CRUD tier) + Zod validation with enum check
 */
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limit
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.CRUD);
        if (rl) return rl;

        // Validate Input
        const body = await req.json();
        const validation = validateInput(body, applicationUpdateSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { id, status } = validation.data;

        const [updated] = await db
            .update(applications)
            .set({
                status,
                updatedAt: new Date(),
                ...(status === "applied" && { appliedDate: new Date().toISOString().split("T")[0] }),
            })
            .where(and(eq(applications.id, id), eq(applications.userId, userId)))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: "Application not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ application: updated });
    } catch (error) {
        console.error("Update application error:", error);
        return NextResponse.json(
            { error: "Failed to update application." },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/applications
 * Delete an application.
 *
 * SECURITY: Rate limited (CRUD tier) + UUID validation
 */
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limit
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.CRUD);
        if (rl) return rl;

        // Validate Input
        const body = await req.json();
        const validation = validateInput(body, applicationDeleteSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { id } = validation.data;

        const [deleted] = await db
            .delete(applications)
            .where(and(eq(applications.id, id), eq(applications.userId, userId)))
            .returning({ id: applications.id });

        if (!deleted) {
            return NextResponse.json(
                { error: "Application not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Delete application error:", error);
        return NextResponse.json(
            { error: "Failed to delete application." },
            { status: 500 }
        );
    }
}
