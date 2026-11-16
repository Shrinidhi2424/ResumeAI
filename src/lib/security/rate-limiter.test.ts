import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit } from "./rate-limiter";

describe("checkRateLimit", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("allows N requests, then blocks with 429", () => {
        const config = { max: 3, windowSec: 60, prefix: "test-block" };
        for (let i = 0; i < 3; i++) {
            expect(checkRateLimit("user-a", config)).toBeNull();
        }
        const blocked = checkRateLimit("user-a", config);
        expect(blocked?.status).toBe(429);
        expect(blocked?.headers.get("Retry-After")).toBe("60");
    });

    it("tracks each identifier separately", () => {
        const config = { max: 1, windowSec: 60, prefix: "test-separate" };
        expect(checkRateLimit("user-a", config)).toBeNull();
        expect(checkRateLimit("user-b", config)).toBeNull();
        expect(checkRateLimit("user-a", config)?.status).toBe(429);
    });

    it("allows requests again after the window has passed", () => {
        const config = { max: 2, windowSec: 60, prefix: "test-reset" };
        checkRateLimit("user-a", config);
        checkRateLimit("user-a", config);
        expect(checkRateLimit("user-a", config)?.status).toBe(429);

        // Hitting the limit blocks for one full window, so move past it.
        vi.advanceTimersByTime(60_001);
        expect(checkRateLimit("user-a", config)).toBeNull();
    });
});
