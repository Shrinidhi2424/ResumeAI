import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components,
 * Server Actions, and Route Handlers.
 *
 * This client reads and writes cookies through Next.js's `cookies()` API
 * to maintain auth sessions across requests.
 *
 * Usage:
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 *
 * IMPORTANT: This function is async because `cookies()` is async
 * in Next.js 15+. Always `await` the result.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method is called from a Server Component where
                        // cookies cannot be set. This can safely be ignored if you have
                        // middleware refreshing user sessions.
                    }
                },
            },
        }
    );
}

/**
 * Creates a Supabase admin client with the service role key.
 *
 * ⚠️  DANGER: This client bypasses Row-Level Security (RLS).
 * Use only in trusted server-side contexts (e.g., admin API routes,
 * cron jobs, data migrations).
 *
 * Usage:
 *   import { createAdminClient } from "@/lib/supabase/server";
 *   const supabase = createAdminClient();
 */
export function createAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return [];
                },
                setAll() {
                    // Admin client doesn't need cookie management
                },
            },
        }
    );
}
