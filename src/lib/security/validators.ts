/**
 * Zod Validation Schemas — ResumeAI Pro
 *
 * Strict input validation for all API endpoints.
 *
 * SECURITY: Schema-based validation with:
 *   - Type checks (string, number, enum)
 *   - Length limits (prevent oversized payloads)
 *   - Required vs optional fields
 *   - Strips unexpected fields (.strict() or .strip())
 *   - Sanitization (trim whitespace, reject empty strings)
 *
 * OWASP Reference: A03:2021 — Injection Prevention
 */

import { z } from "zod";

// ── Shared Validators ────────────────────────────────────────

/** Non-empty trimmed string with max length */
const safeString = (maxLen: number) =>
    z.string().trim().min(1, "Required").max(maxLen);

/** Optional trimmed string */
const optionalString = (maxLen: number) =>
    z.string().trim().max(maxLen).optional().or(z.literal(""));

/** UUID v4 format */
const uuid = z.string().uuid("Invalid ID format");

// ── Analyze Endpoint ─────────────────────────────────────────

export const analyzeSchema = z
    .object({
        resumeId: uuid,
        jobDescription: safeString(10_000).refine(
            (v) => v.trim().length >= 20,
            "Job description must be at least 20 characters"
        ),
        companyName: optionalString(255),
        jobTitle: optionalString(255),
    })
    .strict(); // Reject unexpected fields

// ── Resume Upload (validated at FormData level, not Zod) ─────
// File validation is done inline since FormData ≠ JSON.

export const resumeUploadMetaSchema = z
    .object({
        versionName: optionalString(255),
    })
    .strict();

// ── Resume Create (Builder) ──────────────────────────────────

const personalInfoSchema = z.object({
    fullName: safeString(100),
    email: z.string().email("Invalid email").max(255),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    location: optionalString(100),
    linkedin: optionalString(500),
    github: optionalString(500),
    portfolio: optionalString(500),
});

const resumeSectionSchema = z.object({
    id: z.string().max(100).optional(),
    title: optionalString(200),
    institution: optionalString(200),
    company: optionalString(200),
    location: optionalString(100),
    startDate: optionalString(50),
    endDate: optionalString(50),
    description: optionalString(2000),
    bullets: z.array(z.string().max(500)).max(20).optional(),
    degree: optionalString(200),
    gpa: optionalString(20),
});

export const resumeCreateSchema = z
    .object({
        versionName: safeString(255),
        resumeData: z.object({
            personalInfo: personalInfoSchema,
            summary: z.string().max(2000).optional().or(z.literal("")),
            experience: z.array(resumeSectionSchema).max(20).optional(),
            education: z.array(resumeSectionSchema).max(10).optional(),
            skills: z.array(z.string().max(100)).max(50).optional(),
            projects: z.array(resumeSectionSchema).max(20).optional(),
            certifications: z.array(z.string().max(200)).max(20).optional(),
        }),
    })
    .strict();

// ── Cover Letter ─────────────────────────────────────────────

export const coverLetterSchema = z
    .object({
        resumeId: uuid,
        companyName: safeString(255),
        jobDescription: safeString(15_000), // Increased limit for detailed JDs
        companyNews: optionalString(5000),
        tone: z.enum(["professional", "enthusiastic", "technical"]),
        prompt: z.string().optional(), // Injected by useCompletion
    })
    .strict();

// ── Interview Generate ──────────────────────────────────────

export const interviewGenerateSchema = z
    .object({
        analysisId: uuid,
    })
    .strict();

// ── Interview Feedback ──────────────────────────────────────

export const interviewFeedbackSchema = z
    .object({
        questionId: uuid,
        userAnswer: safeString(5000),
    })
    .strict();

// ── Company Enrich ──────────────────────────────────────────

export const companyEnrichSchema = z
    .object({
        companyName: safeString(255),
    })
    .strict();

// ── Applications ────────────────────────────────────────────

export const applicationCreateSchema = z
    .object({
        companyName: safeString(255),
        jobTitle: safeString(255),
        resumeId: uuid.optional(),
        status: z
            .enum([
                "wishlist",
                "applied",
                "online_test",
                "interview",
                "offer",
                "rejected",
            ])
            .optional(),
        notes: z.string().max(2000).optional(),
        appliedDate: z.string().max(20).optional(),
    })
    .strict();

export const applicationUpdateSchema = z
    .object({
        id: uuid,
        status: z.enum([
            "wishlist",
            "applied",
            "online_test",
            "interview",
            "offer",
            "rejected",
        ]),
    })
    .strict();

export const applicationDeleteSchema = z
    .object({
        id: uuid,
    })
    .strict();

// ── Helper: Parse & Validate ─────────────────────────────────

/**
 * Parse and validate request body against a Zod schema.
 * Returns the validated data or a formatted error response.
 *
 * @param body - Raw request body (parsed JSON)
 * @param schema - Zod schema to validate against
 * @returns { success: true, data } or { success: false, error }
 */
export function validateInput<T extends z.ZodType>(
    body: unknown,
    schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
    const result = schema.safeParse(body);
    if (!result.success) {
        // Format Zod errors into a readable message
        const issues = result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ");
        return { success: false, error: `Validation error: ${issues}` };
    }
    return { success: true, data: result.data };
}
