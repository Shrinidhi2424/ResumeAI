# ResumeAI Pro 🚀

ResumeAI Pro is a next-generation career toolkit powered by **Google Gemini 1.5 Flash**. It helps job seekers beat Applicant Tracking Systems (ATS), build professional resumes, write tailored cover letters, and track their job applications—all in one unified dashboard.

![ResumeAI Hero](https://i.imgur.com/your-hero-image-placeholder.png)

## ✨ Features

### 🔍 Smart Resume Scanner
*   **ATS Analysis**: Upload your resume (PDF) and a job description to get an instant compatibility score.
*   **AI Feedback**: get actionable advice on missing keywords, formatting issues, and skill gaps.
*   **Match Score**: A clear 0-100 score to gauge your chances of landing an interview.
*   **Security**: All uploads are processed securely and never shared.

### 📝 AI Cover Letter Generator
*   **Tailored Content**: Generate a professional cover letter specific to the job you're applying for.
*   **Tone Selection**: Choose between *Professional*, *Enthusiastic*, or *Confident* tones.
*   **Real-time Streaming**: Watch your cover letter being written in real-time.
*   **PDF Export**: Download your cover letter as a perfectly formatted PDF ready for submission.

### 🏗️ Drag-and-Drop Resume Builder
*   **Interactive Builder**: Create your resume section by section (Education, Experience, Projects).
*   **Live Preview**: See changes instantly as you type.
*   **PDF Export**: Download a ATS-friendly PDF version of your resume.
*   **Auto-Save**: integrated with local storage to prevent data loss.

### 📊 Application Tracker (Kanban Board)
*   **Visual Workflow**: Organize your job hunt with a drag-and-drop Kanban board.
*   **Status Tracking**: Move applications through stages: *Wishlist*, *Applied*, *Interview*, *Offer*, *Rejected*.
*   **Persistence**: Automatically saves your application status to the database.

### 🔐 Modern Authentication & Dashboard
*   **Unified Dashboard**: A central hub to access all tools with a consistent, sticky glassmorphic header.
*   **Secure Auth**: Powered by **Clerk** (Sign In / Sign Up) with protected routes.
*   **User Management**: Seamless profile management and secure data isolation.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **AI Model**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (via Vercel AI SDK)
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Drizzle ORM)
*   **Auth**: [Clerk](https://clerk.com/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/) + [Lucide React](https://lucide.dev/)
*   **Drag & Drop**: [dnd-kit](https://dndkit.com/)

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Shrinidhi2424/ResumeAI.git
    cd ResumeAI
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file in the root directory and add the following keys:
    ```env
    # Authentication (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...

    # Database (Supabase)
    DATABASE_URL=postgresql://...

    # AI (Google Gemini)
    GEMINI_API_KEY=AIza...

    # App Config
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛡️ Security

*   **Rate Limiting**: API routes are protected against abuse.
*   **Input Validation**: Strict Zod schemas for all user inputs.
*   **Secure Headers**: configured for protection against XSS and other attacks.

---
