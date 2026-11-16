import { describe, it, expect } from "vitest";
import { analyzeSchema, validateInput } from "./validators";

const validBody = {
    resumeId: "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e",
    jobDescription: "We are hiring a backend engineer with Node.js and PostgreSQL.",
};

describe("analyzeSchema", () => {
    it("accepts a valid body", () => {
        expect(validateInput(validBody, analyzeSchema).success).toBe(true);
    });

    it("rejects a missing resumeId", () => {
        const result = validateInput({ jobDescription: validBody.jobDescription }, analyzeSchema);
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("resumeId");
    });

    it("rejects an empty job description", () => {
        const result = validateInput({ ...validBody, jobDescription: "   " }, analyzeSchema);
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("jobDescription");
    });

    it("rejects unexpected fields (strict)", () => {
        expect(validateInput({ ...validBody, extra: 1 }, analyzeSchema).success).toBe(false);
    });
});
