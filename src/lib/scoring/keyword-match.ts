/**
 * Deterministic keyword scorer.
 *
 * Pure functions, no I/O: the same resume + job description always gives
 * the same result. Used next to the Gemini score, and on its own when
 * Gemini is unavailable.
 */
import { SKILLS } from "./skills";

/** Below this many known skills in the JD, a percentage is not meaningful. */
export const MIN_JD_SKILLS = 3;

export interface KeywordCoverage {
    /** 0–100 (rounded), or null if the JD has too few known skills */
    score: number | null;
    matched: string[];
    missing: string[];
    /** Number of known skills found in the job description */
    total: number;
    /** Why score is null */
    reason?: string;
}

/** Escape characters that have a special meaning in a regular expression. */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/**
 * One regex per skill that matches the name or any alias as a whole word.
 *
 * `\b` doesn't work for terms like "c++", "c#" or ".net", so we use our own
 * boundaries: the term must not touch a letter, digit, "+" or "#" on either
 * side, or a "." just before it. So "java" does not match "javascript",
 * "sql" does not match "mysql", and "js" does not match "node.js".
 *
 * Terms with a single character are skipped (too ambiguous).
 */
const SKILL_PATTERNS = SKILLS.map((skill) => {
    const terms = [skill.name, ...skill.aliases]
        .filter((term) => term.length > 1)
        .map(escapeRegExp);
    return {
        name: skill.name,
        pattern: new RegExp(`(?<![a-z0-9+#.])(?:${terms.join("|")})(?![a-z0-9+#])`, "i"),
    };
});

/** Canonical skill names found in `text`, in dictionary order, no duplicates. */
function findSkills(text: string): string[] {
    return SKILL_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
        ({ name }) => name
    );
}

/**
 * Canonical skills mentioned in a job description.
 * Dictionary lookup only: unknown words are never extracted.
 */
export function extractJobKeywords(jd: string): string[] {
    return findSkills(jd);
}

/**
 * What share of the JD's known skills also appear in the resume.
 *
 * score = round(matched / total × 100), where total is the number of
 * known skills in the JD. Returns score null if total < MIN_JD_SKILLS.
 */
export function scoreKeywordCoverage(resumeText: string, jd: string): KeywordCoverage {
    const jdSkills = extractJobKeywords(jd);
    const resumeSkills = new Set(findSkills(resumeText));

    const matched = jdSkills.filter((skill) => resumeSkills.has(skill));
    const missing = jdSkills.filter((skill) => !resumeSkills.has(skill));
    const total = jdSkills.length;

    if (total < MIN_JD_SKILLS) {
        return {
            score: null,
            matched,
            missing,
            total,
            reason: `Only ${total} known skill(s) found in the job description; at least ${MIN_JD_SKILLS} are needed for a coverage score.`,
        };
    }

    return {
        score: Math.round((matched.length / total) * 100),
        matched,
        missing,
        total,
    };
}
