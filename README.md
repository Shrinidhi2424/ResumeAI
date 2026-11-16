# ResumeAI Pro

A career toolkit built with Next.js. You upload a PDF resume and paste a job description. The app scores the match with Google Gemini and a deterministic keyword scorer, and shows an estimated "recruiter attention" heatmap over page 1 of your resume. It also streams tailored cover letters, generates interview questions, and includes a resume builder, an application tracker and a Chrome extension that scans LinkedIn job posts.

The AI model is **`gemini-2.5-flash`** by default. Set `GEMINI_MODEL` to use a different model.

## Features

- **Resume analysis**: compatibility score, ATS score, matched and missing keywords, an executive summary and suggested improvements, all from Gemini.
- **Keyword coverage (deterministic)**: the share of known tech skills in the job description that also appear in the resume. It is always computed and shown next to the AI score, and it is used on its own if Gemini is unavailable.
- **Recruiter-attention heatmap**: a heuristic overlay on page 1 of the uploaded PDF, combining an F-pattern position weight with matched keywords.
- **Cover letter generator**: streams text as Gemini writes it, then saves the finished letter.
- **Interview questions and feedback**, **company profile**, **resume builder**, **application tracker (Kanban)** and an **admin analytics** page.
- **Chrome extension**: scrapes the job post on the current LinkedIn page and sends it to `/api/analyze`.

## Architecture

- **Upload** (`POST /api/resumes/upload`): validate the PDF → store it in **Supabase Storage** → extract text with **pdf2json** → save it to the `resumes` table in **Postgres** (Drizzle ORM).
- **Analyze** (`POST /api/analyze`): auth (Clerk) → rate limit → Zod validation → **keyword scorer** → **Gemini** prompt and JSON parse (falls back to keyword-only if this fails) → download the PDF and build the **heatmap** from page-1 text positions → save to the `analyses` table → JSON response.
- **Cover letter** (`POST /api/cover-letter/generate`): Gemini `generateContentStream` → web `ReadableStream` → the client renders chunks with `useCompletion` from `@ai-sdk/react` → the full text is saved when the stream ends.
- **Chrome extension** (`extension/`, Vite + React, Manifest V3): a content script scrapes LinkedIn → the popup calls `/api/resumes` and `/api/analyze` with the user's session cookie → shows the scores and a link to the full results page.

Main code locations:

| Path | What it is |
|---|---|
| `src/lib/ai/` | Gemini client (`gemini.ts`), prompts, response parser |
| `src/lib/scoring/` | Skills dictionary and deterministic keyword scorer |
| `src/lib/pdf/` | pdf2json text extraction, page-1 text positions, heatmap algorithm |
| `src/lib/security/` | In-memory rate limiter, Zod validators |
| `src/app/api/` | Route handlers |
| `extension/` | Chrome extension |

## Environment variables

Put these in `.env.local` (never commit it). Only the names are listed here.

| Name | Used for |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (read by the Clerk SDK) |
| `CLERK_SECRET_KEY` | Clerk auth (read by the Clerk SDK) |
| `CLERK_WEBHOOK_SECRET` | Verifying Clerk user webhooks |
| `DATABASE_URL` | Postgres connection (Drizzle) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Storage upload and download |
| `GEMINI_API_KEY` | Gemini; without it, AI features return 503 and analysis falls back to keyword-only |
| `GEMINI_MODEL` | Optional model override (default `gemini-2.5-flash`) |
| `NEWS_API_KEY` | Optional company news for the company profile |
| `NEXT_PUBLIC_APP_URL` | Base URL used by the admin analytics page |

Extension: copy `extension/.env.example` to `extension/.env` and set `VITE_API_BASE` (default `http://localhost:3000`). If you change it, also add the new origin to `host_permissions` in `extension/public/manifest.json`.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000

cd extension
npm install
npm run build          # load extension/dist as an unpacked extension in Chrome
```

## Tests and CI

```bash
npm test               # Vitest: unit tests for pure logic, no network calls
npm run lint
npx tsc --noEmit
```

The tests cover the Gemini response parser, the heatmap algorithm, pdf2json text-item extraction, the keyword scorer, the rate limiter and the request validators. They never call Gemini, Supabase or the database.

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:
1. **Web app**: Node 20, `npm ci`, lint, `tsc --noEmit`, `npm test`.
2. **Extension**: `npm ci && npm run build` in `extension/`.

`next build` is not run in CI because it needs real secrets.

## Design decisions

- **LLM for generation, deterministic code for anything that must be reproducible.** Gemini writes summaries, suggestions, cover letters and interview questions. The keyword-coverage score is a pure function: the same resume and job description always give the same number. It is unit-tested, and it still works when Gemini is down or misconfigured.
- **Graceful degradation.** The Gemini client is created lazily and throws a typed `AIUnavailableError` only when an AI call is made, so a missing key doesn't crash pages at import time. If Gemini fails during analysis, the route returns `mode: "keyword-only"` instead of an error. The heatmap is best-effort: a failure there never fails the analysis.
- **Server Components for data pages.** The results page queries Postgres on the server and sends rendered HTML, so no database code or keys reach the browser. Only interactive parts (score animation, the PDF heatmap viewer) are Client Components.
- **Streaming for long generations.** Cover letters take several seconds to generate. Streaming shows text as it arrives instead of showing a spinner until the whole letter is done.

## Limitations

- **The heatmap is a heuristic, not eye-tracking data.** It combines fixed F-pattern weights with a keyword boost. It covers **page 1 only**, and text height is a fixed constant because pdf2json gives none.
- **The rate limiter is in memory.** It resets when the server restarts, and each server instance has its own counts, so it is not a global limit on serverless or multi-instance deployments.
- **The skills dictionary is hand-curated** (in `src/lib/scoring/skills.ts`). Skills not in it are ignored, and a few ambiguous words are deliberately left out (for example "go", "c", "r"). Overlapping entries can both match (for example "React Native" also counts as "react").
- **Generation features still need Gemini.** Only resume analysis has a real non-AI fallback. Cover letters and interview questions return 503 without a key, and the company profile saves only its non-AI fields (such as news).
- **Keyword coverage is not stored in the database.** It is recomputed on the results page from the stored resume text and job description.
