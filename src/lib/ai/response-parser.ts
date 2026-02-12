import type { AnalysisResult } from "@/types";

/**
 * Parse the AI response string into a structured AnalysisResult.
 *
 * Gemini sometimes wraps JSON in markdown code fences or adds
 * trailing text. This parser handles those edge cases.
 *
 * @param rawResponse - Raw text from Gemini API
 * @returns Validated AnalysisResult object
 * @throws Error if the response cannot be parsed as valid JSON
 */
export function parseAnalysisResponse(rawResponse: string): AnalysisResult {
    // Step 1: Strip markdown code fences if present
    let cleaned = rawResponse.trim();

    // Remove ```json ... ``` wrapping
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    }

    // Step 2: Attempt JSON parse
    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        // Step 3: Try to find JSON object within the text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(
                `AI response is not valid JSON. Raw response: ${rawResponse.slice(0, 500)}`
            );
        }
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            throw new Error(
                `Failed to parse extracted JSON from AI response. Raw response: ${rawResponse.slice(0, 500)}`
            );
        }
    }

    // Step 4: Validate required fields and apply defaults
    const result: AnalysisResult = {
        compatibilityScore: clampScore(parsed.compatibility_score),
        atsScore: clampScore(parsed.ats_score),
        matchedKeywords: ensureStringArray(parsed.matched_keywords),
        missingKeywords: ensureStringArray(parsed.missing_keywords),
        executiveSummary:
            typeof parsed.executive_summary === "string"
                ? parsed.executive_summary
                : "No summary provided.",
        improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements.map((imp: Record<string, unknown>) => ({
                section: String(imp.section || "General"),
                currentText: imp.current_text ? String(imp.current_text) : undefined,
                suggestedText: String(imp.suggested_text || ""),
                reasoning: String(imp.reasoning || ""),
            }))
            : [],
        redFlags: ensureStringArray(parsed.red_flags),
        standoutPoints: ensureStringArray(parsed.standout_points),
    };

    return result;
}

/**
 * Clamp a score value to 0-100 range.
 */
function clampScore(value: unknown): number {
    const num = typeof value === "number" ? value : Number(value) || 0;
    return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Ensure a value is a string array, returning empty array if not.
 */
function ensureStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => typeof item === "string");
}
