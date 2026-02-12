import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that require authentication.
 * All dashboard and admin routes are protected.
 * API routes under /api are also protected (except webhooks if added later).
 */
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/upload(.*)",
    "/results(.*)",
    "/batch(.*)",
    "/cover-letter(.*)",
    "/interview-prep(.*)",
    "/tracker(.*)",
    "/builder(.*)",
    "/history(.*)",
    "/analytics(.*)",
    "/reports(.*)",
    "/api/((?!webhooks).*)", // Protect all API routes except /api/webhooks/*
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
