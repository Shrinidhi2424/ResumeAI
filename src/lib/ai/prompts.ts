// ============================================================
// AI PROMPT TEMPLATES — ResumeAI Pro
// From Section 4 of the Master Documentation.
// ============================================================

/**
 * Resume Analysis Prompt
 *
 * Inputs:
 *   - resumeText: Cleaned text extracted from the PDF
 *   - jobDescription: Job description text from the user
 *
 * Returns: Strict JSON with scores, keywords, and improvements.
 */
export function buildAnalyzePrompt(
    resumeText: string,
    jobDescription: string
): string {
    return `
You are an expert ATS (Application Tracking System) and professional recruiter with 15 years of experience.

TASK: Analyze the following resume against the job description and provide a detailed compatibility assessment.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Calculate a compatibility score (0-100) based on:
   - Keyword matching (40%)
   - Experience relevance (30%)
   - Skills alignment (20%)
   - Education fit (10%)

2. Identify matched keywords (exact or semantic matches)

3. Identify critical missing keywords that appear in JD but not resume

4. Provide an executive summary (3-4 sentences)

5. Give section-specific improvement suggestions with EXACTLY how to rewrite bullet points

6. Calculate ATS readability score (considers formatting, structure, clarity)

CRITICAL: Respond ONLY with valid JSON in this exact structure:
{
  "compatibility_score": <number 0-100>,
  "ats_score": <number 0-100>,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword3", "keyword4"],
  "executive_summary": "string",
  "improvements": [
    {
      "section": "Experience" | "Skills" | "Education" | "Projects",
      "current_text": "original bullet point",
      "suggested_text": "improved version with metrics",
      "reasoning": "why this is better"
    }
  ],
  "red_flags": ["formatting issue", "gap in experience"],
  "standout_points": ["unique achievement"]
}

DO NOT include any text outside the JSON object. DO NOT use markdown formatting.
`.trim();
}

/**
 * Cover Letter Generation Prompt
 *
 * Inputs:
 *   - resumeSummary: Key highlights from the resume
 *   - jobDescription: Target job description
 *   - companyName: Target company
 *   - companyNews: Recent company news (if available)
 *   - tone: "professional" | "enthusiastic" | "technical"
 */
export function buildCoverLetterPrompt(
    resumeSummary: string,
    jobDescription: string,
    companyName: string,
    companyNews: string,
    tone: "professional" | "enthusiastic" | "technical"
): string {
    return `
You are a professional cover letter writer who has helped thousands of candidates get interviews.

INPUTS:
Resume Summary: ${resumeSummary}
Job Description: ${jobDescription}
Company: ${companyName}
Recent News: ${companyNews}
Tone: ${tone}

TASK: Write a compelling cover letter (250-300 words) that:
1. Opens with genuine enthusiasm tied to recent company news/mission
2. Connects specific resume achievements to JD requirements (use metrics)
3. Shows cultural fit
4. Ends with confident call-to-action

TONE GUIDELINES:
- Professional: Formal, corporate language
- Enthusiastic: Energetic, startup-friendly, show passion
- Technical: Focus on technical skills, architecture, problem-solving

FORMAT: Return only the letter text, no JSON wrapper.
Start with "Dear Hiring Manager," and end with "Sincerely, [Candidate Name]"
`.trim();
}

/**
 * Interview Question Generation Prompt
 *
 * Inputs:
 *   - analysisData: Summary of the resume analysis result
 *   - missingKeywords: Skills the candidate is missing
 *   - redFlags: Potential concerns from the resume
 */
export function buildInterviewPrompt(
    analysisData: string,
    missingKeywords: string[],
    redFlags: string[]
): string {
    return `
You are an experienced technical interviewer.

CONTEXT:
Resume Analysis: ${analysisData}
Missing Skills: ${missingKeywords.join(", ")}
Weak Points: ${redFlags.join(", ")}

TASK: Generate 12 interview questions this candidate is likely to face:

CATEGORIES:
1. Technical (5 questions) - Focus on skills mentioned but not demonstrated
2. Behavioral (4 questions) - STAR format, leadership, teamwork
3. Situational (3 questions) - Resume gaps, weak explanations

DIFFICULTY MIX:
- 4 Easy (warm-up)
- 5 Medium (core assessment)
- 3 Hard (differentiator)

CRITICAL: Respond ONLY with a valid JSON array in this exact structure:
[
  {
    "question": "string",
    "category": "technical" | "behavioral" | "situational",
    "difficulty": "easy" | "medium" | "hard",
    "why_asking": "what this reveals about candidate",
    "sample_answer_structure": "brief outline of good answer"
  }
]

DO NOT include any text outside the JSON array. DO NOT use markdown formatting.
`.trim();
}
