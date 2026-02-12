import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  date,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);

export const coverLetterToneEnum = pgEnum("cover_letter_tone", [
  "professional",
  "enthusiastic",
  "technical",
]);

export const questionCategoryEnum = pgEnum("question_category", [
  "behavioral",
  "technical",
  "situational",
]);

export const questionDifficultyEnum = pgEnum("question_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "wishlist",
  "applied",
  "online_test",
  "interview",
  "offer",
  "rejected",
]);

// ============================================================
// TABLES
// ============================================================

// ── Users ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk string ID (e.g., user_2abc...)
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("student").notNull(),
  college: varchar("college", { length: 255 }),
  department: varchar("department", { length: 100 }),
  graduationYear: integer("graduation_year"),
  credits: integer("credits").default(10).notNull(), // Free tier: 10 scans
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Resumes ─────────────────────────────────────────────────
export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  versionName: varchar("version_name", { length: 255 }).notNull(),
  fileUrl: text("file_url"),              // Supabase Storage URL (null for builder-created)
  parsedText: text("parsed_text"),        // Extracted text from PDF
  resumeData: jsonb("resume_data"),       // Structured JSON from builder
  isStarred: boolean("is_starred").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Job Descriptions ────────────────────────────────────────
export const jobDescriptions = pgTable("job_descriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  description: text("description").notNull(),
  postedUrl: text("posted_url"), // LinkedIn/Naukri link
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Analyses ────────────────────────────────────────────────
export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeId: uuid("resume_id")
      .references(() => resumes.id, { onDelete: "cascade" })
      .notNull(),
    jdId: uuid("jd_id").references(() => jobDescriptions.id, {
      onDelete: "set null",
    }),

    // Scores
    compatibilityScore: integer("compatibility_score"),
    atsScore: integer("ats_score"),

    // Keyword Analysis (JSONB)
    matchedKeywords: jsonb("matched_keywords").$type<string[]>(),
    missingKeywords: jsonb("missing_keywords").$type<string[]>(),

    // Detailed Feedback
    executiveSummary: text("executive_summary"),
    improvements: jsonb("improvements").$type<
      {
        section: string;
        currentText?: string;
        suggestedText: string;
        reasoning: string;
      }[]
    >(),

    // Heatmap Data (coordinates for visualization)
    heatmapData: jsonb("heatmap_data").$type<
      { x: number; y: number; intensity: number }[]
    >(),

    // Metadata
    processingTimeMs: integer("processing_time_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "compatibility_score_range",
      sql`${table.compatibilityScore} >= 0 AND ${table.compatibilityScore} <= 100`
    ),
    check(
      "ats_score_range",
      sql`${table.atsScore} >= 0 AND ${table.atsScore} <= 100`
    ),
  ]
);

// ── Cover Letters ───────────────────────────────────────────
export const coverLetters = pgTable("cover_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  jdId: uuid("jd_id").references(() => jobDescriptions.id, {
    onDelete: "set null",
  }),
  tone: coverLetterToneEnum("tone").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Interview Questions ─────────────────────────────────────
export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  question: text("question").notNull(),
  category: questionCategoryEnum("category").notNull(),
  difficulty: questionDifficultyEnum("difficulty").notNull(),
  userAnswer: text("user_answer"),   // If practice mode used
  aiFeedback: text("ai_feedback"),
  score: integer("score"),           // AI grade 0-10
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Applications (Tracker) ──────────────────────────────────
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "set null",
  }),
  status: applicationStatusEnum("status").default("wishlist").notNull(),
  appliedDate: date("applied_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Company Intelligence Cache ──────────────────────────────
export const companyIntel = pgTable("company_intel", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).unique().notNull(),
  industry: varchar("industry", { length: 255 }),
  headquarters: varchar("headquarters", { length: 255 }),
  description: text("description"),
  glassdoorRating: decimal("glassdoor_rating", {
    precision: 2,
    scale: 1,
  }),
  interviewDifficulty: varchar("interview_difficulty", { length: 50 }), // "Easy" | "Medium" | "Hard"
  recentNews: jsonb("recent_news").$type<
    { title: string; date: string; url: string }[]
  >(),
  techStack: jsonb("tech_stack").$type<string[]>(),
  cultureKeywords: jsonb("culture_keywords").$type<string[]>(),
  employeeCount: integer("employee_count"),
  lastUpdated: timestamp("last_updated", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Skill Gaps (Admin Analytics) ────────────────────────────
export const skillGaps = pgTable("skill_gaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  department: varchar("department", { length: 100 }),
  batchYear: integer("batch_year"),
  skillName: varchar("skill_name", { length: 255 }).notNull(),
  gapPercentage: decimal("gap_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  jobDescriptions: many(jobDescriptions),
  coverLetters: many(coverLetters),
  applications: many(applications),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  analyses: many(analyses),
  applications: many(applications),
}));

export const jobDescriptionsRelations = relations(
  jobDescriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [jobDescriptions.userId],
      references: [users.id],
    }),
    analyses: many(analyses),
    coverLetters: many(coverLetters),
  })
);

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  resume: one(resumes, {
    fields: [analyses.resumeId],
    references: [resumes.id],
  }),
  jobDescription: one(jobDescriptions, {
    fields: [analyses.jdId],
    references: [jobDescriptions.id],
  }),
  interviewQuestions: many(interviewQuestions),
}));

export const coverLettersRelations = relations(coverLetters, ({ one }) => ({
  user: one(users, {
    fields: [coverLetters.userId],
    references: [users.id],
  }),
  jobDescription: one(jobDescriptions, {
    fields: [coverLetters.jdId],
    references: [jobDescriptions.id],
  }),
}));

export const interviewQuestionsRelations = relations(
  interviewQuestions,
  ({ one }) => ({
    analysis: one(analyses, {
      fields: [interviewQuestions.analysisId],
      references: [analyses.id],
    }),
  })
);

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [applications.resumeId],
    references: [resumes.id],
  }),
}));
