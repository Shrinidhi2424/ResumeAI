/**
 * In-Memory Rate Limiter — ResumeAI Pro
 *
 * Provides IP-based and user-based rate limiting for API routes.
 *
 * SECURITY: Uses sliding window algorithm.
 * - Each requester gets a fixed-size window (e.g., 10 requests in 60s).
 * - Returns 429 Too Many Requests with Retry-After header when limit is hit.
 * - Auto-cleans expired entries every 5 minutes to prevent memory leaks.
 *
 * OWASP Reference: A04:2021 — Insecure Design (rate limiting prevents abuse)
 *
 * NOTE: For production at scale, replace with Redis-based rate limiting
 *       (e.g., Upstash Ratelimit). This in-memory store works for single
 *       instance deployments (Vercel serverless has per-instance memory).
 */

import { NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────

interface RateLimitEntry {
    timestamps: number[];
    blocked_until?: number;
}

interface RateLimitConfig {
    /** Max requests allowed in the window */
    max: number;
    /** Time window in seconds */
    windowSec: number;
    /** Identifier prefix for this limiter (e.g., "upload", "analyze") */
    prefix: string;
}

// ── Store ────────────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>();

// Auto-clean expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            // Remove entries with no recent timestamps
            const recent = entry.timestamps.filter(
                (t) => now - t < 300_000 // 5 min max retention
            );
            if (recent.length === 0 && (!entry.blocked_until || now > entry.blocked_until)) {
                store.delete(key);
            }
        }
    }, 300_000);
}

// ── Rate Limit Check ─────────────────────────────────────────

/**
 * Check if a request should be rate-limited.
 *
 * @param identifier - Unique key (IP address, userId, or combination)
 * @param config     - Rate limit configuration
 * @returns null if allowed, or a 429 NextResponse if blocked
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): NextResponse | null {
    const key = `${config.prefix}:${identifier}`;
    const now = Date.now();
    const windowMs = config.windowSec * 1000;

    // Get or create entry
    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blocked_until && now < entry.blocked_until) {
        const retryAfter = Math.ceil((entry.blocked_until - now) / 1000);
        return NextResponse.json(
            {
                error: "Too many requests. Please slow down.",
                retryAfter,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": retryAfter.toString(),
                    "X-RateLimit-Limit": config.max.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(entry.blocked_until).toISOString(),
                },
            }
        );
    }

    // Slide the window: remove timestamps older than windowMs
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    // Check if over limit
    if (entry.timestamps.length >= config.max) {
        // Block for the remainder of the window
        entry.blocked_until = now + windowMs;
        const retryAfter = config.windowSec;

        return NextResponse.json(
            {
                error: "Too many requests. Please slow down.",
                retryAfter,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": retryAfter.toString(),
                    "X-RateLimit-Limit": config.max.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(now + windowMs).toISOString(),
                },
            }
        );
    }

    // Allow: record timestamp
    entry.timestamps.push(now);

    return null; // Not rate-limited
}

// ── Pre-configured Limiters ──────────────────────────────────

/**
 * Standard rate limit configs for different endpoint types.
 *
 * Sensible defaults:
 *   - AI endpoints (expensive): 5 req / 60s
 *   - Upload endpoints: 10 req / 60s
 *   - CRUD endpoints: 30 req / 60s
 *   - Read-only endpoints: 60 req / 60s
 */
export const RATE_LIMITS = {
    /** AI-powered endpoints (Gemini calls — expensive) */
    AI: { max: 5, windowSec: 60, prefix: "ai" },

    /** File upload endpoints */
    UPLOAD: { max: 10, windowSec: 60, prefix: "upload" },

    /** Standard CRUD operations */
    CRUD: { max: 30, windowSec: 60, prefix: "crud" },

    /** Read-only / list endpoints */
    READ: { max: 60, windowSec: 60, prefix: "read" },

    /** Admin endpoints */
    ADMIN: { max: 20, windowSec: 60, prefix: "admin" },

    /** Webhook endpoints (high throughput) */
    WEBHOOK: { max: 100, windowSec: 60, prefix: "webhook" },
} as const;

// ── Helper: Extract IP ───────────────────────────────────────

/**
 * Extract the client's IP address from request headers.
 * Uses X-Forwarded-For (Vercel/proxy), then X-Real-IP, then fallback.
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Get a rate limit identifier combining IP and userId.
 * Falls back to IP-only for unauthenticated requests.
 */
export function getRateLimitKey(
    request: Request,
    userId?: string | null
): string {
    const ip = getClientIP(request);
    return userId ? `${userId}:${ip}` : ip;
}
