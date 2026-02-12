import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { resumeCreateSchema, validateInput } from "@/lib/security/validators";

/**
 * POST /api/resumes/create
 *
 * Creates a resume from the builder (structured JSON data).
 *
 * Input: {
 *   versionName: string,
 *   resumeData: ResumeData object,
 * }
 *
 * The parsed_text is auto-generated from the structured data
 * so it can be used for analysis just like uploaded resumes.
 */

interface ResumeSection {
    title?: string;
    institution?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    bullets?: string[];
    degree?: string;
    gpa?: string;
}

interface ResumeData {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        location: string;
        linkedin?: string;
        github?: string;
        portfolio?: string;
    };
    summary: string;
    experience: ResumeSection[];
    education: ResumeSection[];
    skills: string[];
    projects: ResumeSection[];
    certifications: string[];
}

function resumeDataToText(data: ResumeData): string {
    const lines: string[] = [];

    // Personal Info
    const p = data.personalInfo;
    lines.push(p.fullName);
    lines.push(
        [p.email, p.phone, p.location].filter(Boolean).join(" | ")
    );
    if (p.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
    if (p.github) lines.push(`GitHub: ${p.github}`);
    if (p.portfolio) lines.push(`Portfolio: ${p.portfolio}`);
    lines.push("");

    // Summary
    if (data.summary) {
        lines.push("SUMMARY");
        lines.push(data.summary);
        lines.push("");
    }

    // Experience
    if (data.experience.length > 0) {
        lines.push("EXPERIENCE");
        for (const exp of data.experience) {
            lines.push(
                `${exp.title || ""} at ${exp.company || ""} — ${exp.location || ""}`
            );
            lines.push(`${exp.startDate || ""} – ${exp.endDate || "Present"}`);
            if (exp.description) lines.push(exp.description);
            if (exp.bullets) {
                for (const b of exp.bullets) lines.push(`• ${b}`);
            }
            lines.push("");
        }
    }

    // Education
    if (data.education.length > 0) {
        lines.push("EDUCATION");
        for (const edu of data.education) {
            lines.push(
                `${edu.degree || ""} — ${edu.institution || ""}`
            );
            lines.push(`${edu.startDate || ""} – ${edu.endDate || ""}`);
            if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
            if (edu.description) lines.push(edu.description);
            lines.push("");
        }
    }

    // Skills
    if (data.skills.length > 0) {
        lines.push("SKILLS");
        lines.push(data.skills.join(", "));
        lines.push("");
    }

    // Projects
    if (data.projects.length > 0) {
        lines.push("PROJECTS");
        for (const proj of data.projects) {
            lines.push(proj.title || "");
            if (proj.description) lines.push(proj.description);
            if (proj.bullets) {
                for (const b of proj.bullets) lines.push(`• ${b}`);
            }
            lines.push("");
        }
    }

    // Certifications
    if (data.certifications.length > 0) {
        lines.push("CERTIFICATIONS");
        for (const cert of data.certifications) lines.push(`• ${cert}`);
    }

    return lines.join("\n").trim();
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limit (CRUD tier)
        const rl = checkRateLimit(getRateLimitKey(req, userId), RATE_LIMITS.CRUD);
        if (rl) return rl;

        // Validate Input
        const body = await req.json();
        const validation = validateInput(body, resumeCreateSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }
        const { versionName, resumeData } = validation.data;

        // Generate plain text from structured data (for analysis compatibility)
        const parsedText = resumeDataToText(resumeData as ResumeData);

        const [inserted] = await db
            .insert(resumes)
            .values({
                userId,
                versionName: versionName.trim(),
                fileUrl: null, // No uploaded file for builder-created resumes
                parsedText,
                resumeData,
                isStarred: false,
            })
            .returning({
                id: resumes.id,
                versionName: resumes.versionName,
                createdAt: resumes.createdAt,
            });

        return NextResponse.json(
            {
                resumeId: inserted.id,
                versionName: inserted.versionName,
                textLength: parsedText.length,
                createdAt: inserted.createdAt,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Resume create error:", error);
        return NextResponse.json(
            { error: "Failed to create resume." },
            { status: 500 }
        );
    }
}
