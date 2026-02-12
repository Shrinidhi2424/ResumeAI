import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
    users,
    resumes,
    jobDescriptions,
    analyses,
    coverLetters,
    interviewQuestions,
    applications,
    companyIntel,
    skillGaps,
} from "@/lib/db/schema";

// ============================================================
// INFERRED TABLE TYPES (Select = read, Insert = create)
// ============================================================

// ── Users ───────────────────────────────────────────────────
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// ── Resumes ─────────────────────────────────────────────────
export type Resume = InferSelectModel<typeof resumes>;
export type NewResume = InferInsertModel<typeof resumes>;

// ── Job Descriptions ────────────────────────────────────────
export type JobDescription = InferSelectModel<typeof jobDescriptions>;
export type NewJobDescription = InferInsertModel<typeof jobDescriptions>;

// ── Analyses ────────────────────────────────────────────────
export type Analysis = InferSelectModel<typeof analyses>;
export type NewAnalysis = InferInsertModel<typeof analyses>;

// ── Cover Letters ───────────────────────────────────────────
export type CoverLetter = InferSelectModel<typeof coverLetters>;
export type NewCoverLetter = InferInsertModel<typeof coverLetters>;

// ── Interview Questions ─────────────────────────────────────
export type InterviewQuestion = InferSelectModel<typeof interviewQuestions>;
export type NewInterviewQuestion = InferInsertModel<typeof interviewQuestions>;

// ── Applications ────────────────────────────────────────────
export type Application = InferSelectModel<typeof applications>;
export type NewApplication = InferInsertModel<typeof applications>;

// ── Company Intel ───────────────────────────────────────────
export type CompanyIntel = InferSelectModel<typeof companyIntel>;
export type NewCompanyIntel = InferInsertModel<typeof companyIntel>;

// ── Skill Gaps ──────────────────────────────────────────────
export type SkillGap = InferSelectModel<typeof skillGaps>;
export type NewSkillGap = InferInsertModel<typeof skillGaps>;

// ============================================================
// CUSTOM TYPES (API payloads, UI data structures)
// ============================================================

/** A single point on the resume heatmap overlay */
export interface HeatmapPoint {
    x: number;
    y: number;
    intensity: number; // 0–1
}

/** Section-level improvement suggestion from AI */
export interface ImprovementSuggestion {
    section: "Experience" | "Skills" | "Education" | "Projects" | string;
    currentText?: string;
    suggestedText: string;
    reasoning: string;
}

/** Full AI analysis result returned from POST /api/analyze */
export interface AnalysisResult {
    compatibilityScore: number;
    atsScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    executiveSummary: string;
    improvements: ImprovementSuggestion[];
    redFlags: string[];
    standoutPoints: string[];
}

/** Cover letter generation options */
export interface CoverLetterOptions {
    resumeId: string;
    jdId: string;
    companyName: string;
    tone: "professional" | "enthusiastic" | "technical";
    wordCount?: 150 | 250 | 350;
}

/** Interview question returned from AI */
export interface GeneratedQuestion {
    question: string;
    category: "behavioral" | "technical" | "situational";
    difficulty: "easy" | "medium" | "hard";
    whyAsking: string;
    sampleAnswerStructure: string;
}

/** Application tracker board column */
export type ApplicationStatus =
    | "wishlist"
    | "applied"
    | "online_test"
    | "interview"
    | "offer"
    | "rejected";

/** Company intelligence data */
export interface CompanyIntelData {
    companyName: string;
    glassdoorRating: number | null;
    recentNews: { title: string; date: string; url: string }[];
    techStack: string[];
    employeeCount: number | null;
}

/** Batch optimization matrix row */
export interface BatchOptimizationRow {
    jobRole: string;
    company: string;
    score: number;
    topMissingKeywords: string[];
    bestResumeVersion: string;
}

/** Admin skill gap entry */
export interface SkillGapEntry {
    skillName: string;
    gapPercentage: number;
    studentCount: number;
}

/** Admin analytics summary */
export interface AdminAnalytics {
    skillGaps: SkillGapEntry[];
    averageScoreByDepartment: Record<string, number>;
    totalScansThisMonth: number;
    mostTargetedCompanies: { name: string; count: number }[];
    mostAppliedRoles: { role: string; count: number }[];
}
