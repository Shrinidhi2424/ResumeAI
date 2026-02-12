import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/webhooks/clerk
 *
 * Handles Clerk webhook events for user lifecycle management.
 *
 * Supported events:
 *   - user.created  → Insert user into Supabase users table
 *   - user.updated  → Update user profile
 *   - user.deleted  → Delete user (cascades to all related data)
 *
 * Security:
 *   Verifies the webhook signature using the Svix library
 *   and the CLERK_WEBHOOK_SECRET environment variable.
 *
 * Setup:
 *   1. Go to Clerk Dashboard → Webhooks → Create Endpoint
 *   2. URL: https://your-domain.com/api/webhooks/clerk
 *   3. Subscribe to: user.created, user.updated, user.deleted
 *   4. Copy the Signing Secret → set as CLERK_WEBHOOK_SECRET in .env.local
 */

interface ClerkEmailAddress {
    email_address: string;
    id: string;
    verification: { status: string };
}

interface ClerkUserEvent {
    data: {
        id: string;
        email_addresses: ClerkEmailAddress[];
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
        primary_email_address_id: string;
        public_metadata: Record<string, unknown>;
    };
    type: string;
}

export async function POST(req: NextRequest) {
    // ── 1. Verify Webhook Signature ──────────────────────────
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("CLERK_WEBHOOK_SECRET is not set.");
        return NextResponse.json(
            { error: "Server misconfiguration." },
            { status: 500 }
        );
    }

    // Get Svix headers
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
            { error: "Missing Svix verification headers." },
            { status: 400 }
        );
    }

    // Get raw body for signature verification
    const body = await req.text();

    let event: ClerkUserEvent;

    try {
        const wh = new Webhook(WEBHOOK_SECRET);
        event = wh.verify(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as ClerkUserEvent;
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json(
            { error: "Invalid webhook signature." },
            { status: 401 }
        );
    }

    // ── 2. Handle Events ─────────────────────────────────────
    const { type, data } = event;

    try {
        switch (type) {
            // ── user.created ───────────────────────────────────
            case "user.created": {
                const primaryEmail = data.email_addresses.find(
                    (e) => e.id === data.primary_email_address_id
                );

                const fullName = [data.first_name, data.last_name]
                    .filter(Boolean)
                    .join(" ") || "User";

                await db.insert(users).values({
                    id: data.id, // Clerk string ID (e.g., user_2abc...)
                    email: primaryEmail?.email_address || "",
                    name: fullName,
                    role: "student",
                    credits: 10,
                });

                console.log(`[Clerk Webhook] User created: ${data.id}`);
                break;
            }

            // ── user.updated ───────────────────────────────────
            case "user.updated": {
                const primaryEmail = data.email_addresses.find(
                    (e) => e.id === data.primary_email_address_id
                );

                const fullName = [data.first_name, data.last_name]
                    .filter(Boolean)
                    .join(" ") || "User";

                await db
                    .update(users)
                    .set({
                        email: primaryEmail?.email_address || "",
                        name: fullName,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, data.id));

                console.log(`[Clerk Webhook] User updated: ${data.id}`);
                break;
            }

            // ── user.deleted ───────────────────────────────────
            case "user.deleted": {
                await db.delete(users).where(eq(users.id, data.id));
                console.log(`[Clerk Webhook] User deleted: ${data.id}`);
                break;
            }

            default:
                console.log(`[Clerk Webhook] Unhandled event type: ${type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error(`[Clerk Webhook] Error handling ${type}:`, error);
        return NextResponse.json(
            { error: "Webhook processing failed." },
            { status: 500 }
        );
    }
}
