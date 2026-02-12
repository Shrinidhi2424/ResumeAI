import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Admin Analytics | ResumeAI Pro",
    description: "Platform-wide analytics dashboard for placement coordinators.",
};

/**
 * Admin Analytics page.
 * Fetches analytics data server-side and passes to the client component.
 */
export default async function AdminAnalyticsPage() {
    // Fetch analytics data from our API (server-side)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let data = {
        skillGaps: [],
        scoreTrends: [],
        overview: {
            total_users: 0,
            total_resumes: 0,
            total_analyses: 0,
            avg_score: 0,
            avg_ats_score: 0,
        },
        departments: [],
        scoreDistribution: [],
    };

    try {
        // Use internal fetch — the admin layout already verified the role
        const res = await fetch(`${baseUrl}/api/admin/analytics`, {
            cache: "no-store",
        });
        if (res.ok) {
            data = await res.json();
        }
    } catch (err) {
        console.error("Failed to fetch admin analytics:", err);
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-600 mb-3">
                        <ShieldCheck className="h-4 w-4" />
                        Admin Dashboard
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
                        Platform Analytics
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Placement-wide insights across all students, resumes, and analyses.
                    </p>
                </div>

                {/* Dashboard */}
                <AnalyticsDashboard
                    skillGaps={data.skillGaps}
                    scoreTrends={data.scoreTrends}
                    overview={data.overview}
                    departments={data.departments}
                    scoreDistribution={data.scoreDistribution}
                />
            </div>
        </main>
    );
}
