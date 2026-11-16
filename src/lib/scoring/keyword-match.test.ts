import { describe, it, expect } from "vitest";
import { extractJobKeywords, scoreKeywordCoverage } from "./keyword-match";
import { SKILLS } from "./skills";

describe("extractJobKeywords", () => {
    it("maps aliases to canonical names and deduplicates", () => {
        const jd = "We use JS, Node, NodeJS, Postgres, k8s and React.js daily. JavaScript is a must.";
        const keywords = extractJobKeywords(jd);
        expect(keywords).toEqual(
            expect.arrayContaining(["javascript", "node.js", "postgresql", "kubernetes", "react"])
        );
        expect(keywords.filter((k) => k === "javascript")).toHaveLength(1);
        expect(keywords.filter((k) => k === "node.js")).toHaveLength(1);
    });

    it("does not match java inside javascript (word boundaries)", () => {
        expect(extractJobKeywords("Strong JavaScript skills")).toEqual(["javascript"]);
        expect(extractJobKeywords("Strong Java skills")).toEqual(["java"]);
    });

    it("does not match sql inside mysql, or js inside node.js", () => {
        expect(extractJobKeywords("MySQL")).toEqual(["mysql"]);
        expect(extractJobKeywords("node.js")).toEqual(["node.js"]);
    });

    it("matches explicit symbol skills like c++ and c#, but never a bare c", () => {
        expect(extractJobKeywords("C++ and C# required")).toEqual(["c++", "c#"]);
        expect(extractJobKeywords("Grade C or a C-level role")).toEqual([]);
    });

    it("only returns dictionary skills", () => {
        expect(extractJobKeywords("Synergy, passion and blockchain-enabled widgets")).toEqual([]);
    });

    it("has lowercase, unique dictionary entries", () => {
        const names = SKILLS.map((s) => s.name);
        expect(new Set(names).size).toBe(names.length);
        for (const skill of SKILLS) {
            for (const term of [skill.name, ...skill.aliases]) {
                expect(term).toBe(term.toLowerCase());
            }
        }
    });
});

describe("scoreKeywordCoverage", () => {
    it("computes round(matched / total * 100)", () => {
        const jd = "Looking for Python, Django, PostgreSQL, Docker and AWS.";
        const resume = "Built APIs in Python and Django, stored data in Postgres.";
        const result = scoreKeywordCoverage(resume, jd);
        expect(result.total).toBe(5);
        expect(result.matched).toEqual(["python", "django", "postgresql"]);
        // Results come back in dictionary order (skills.ts), not JD order.
        expect(result.missing).toEqual(["aws", "docker"]);
        expect(result.score).toBe(60); // 3 / 5
    });

    it("rounds to a whole number", () => {
        const result = scoreKeywordCoverage("React and TypeScript", "React, TypeScript, GraphQL");
        expect(result.score).toBe(67); // 2 / 3 = 66.67 -> 67
    });

    it("returns score null with a reason when the JD has fewer than 3 known skills", () => {
        const result = scoreKeywordCoverage(
            "Python developer",
            "We need a Python person with great vibes."
        );
        expect(result.score).toBeNull();
        expect(result.total).toBe(1);
        expect(result.matched).toEqual(["python"]);
        expect(result.reason).toMatch(/at least 3/);
    });
});
