import { describe, it, expect } from "vitest";
import { parseAnalysisResponse } from "./response-parser";

const valid = {
    compatibility_score: 72,
    ats_score: 81,
    matched_keywords: ["react", "typescript"],
    missing_keywords: ["docker"],
    executive_summary: "Good fit.",
    improvements: [{ section: "Skills", suggested_text: "Add Docker", reasoning: "In JD" }],
};

describe("parseAnalysisResponse", () => {
    it("parses plain JSON and maps snake_case to camelCase", () => {
        const result = parseAnalysisResponse(JSON.stringify(valid));
        expect(result.compatibilityScore).toBe(72);
        expect(result.atsScore).toBe(81);
        expect(result.matchedKeywords).toEqual(["react", "typescript"]);
        expect(result.missingKeywords).toEqual(["docker"]);
        expect(result.executiveSummary).toBe("Good fit.");
        expect(result.improvements[0]).toMatchObject({
            section: "Skills",
            suggestedText: "Add Docker",
            reasoning: "In JD",
        });
    });

    it("parses JSON inside a fenced json code block", () => {
        const raw = "```json\n" + JSON.stringify(valid) + "\n```";
        expect(parseAnalysisResponse(raw).compatibilityScore).toBe(72);
    });

    it("parses JSON with extra text around it", () => {
        const raw = "Here is the analysis:\n" + JSON.stringify(valid) + "\nHope this helps!";
        expect(parseAnalysisResponse(raw).atsScore).toBe(81);
    });

    it("clamps out-of-range scores to 0-100", () => {
        const raw = JSON.stringify({ ...valid, compatibility_score: 150, ats_score: -20 });
        const result = parseAnalysisResponse(raw);
        expect(result.compatibilityScore).toBe(100);
        expect(result.atsScore).toBe(0);
    });

    it("turns non-array keyword fields into empty arrays", () => {
        const raw = JSON.stringify({ ...valid, matched_keywords: "react", missing_keywords: null });
        const result = parseAnalysisResponse(raw);
        expect(result.matchedKeywords).toEqual([]);
        expect(result.missingKeywords).toEqual([]);
    });

    it("throws on garbage input", () => {
        expect(() => parseAnalysisResponse("this is not json at all")).toThrow();
        expect(() => parseAnalysisResponse("{ not: valid json ]")).toThrow();
    });
});
