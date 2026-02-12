import { db } from "@/lib/db";
import { analyses, resumes, jobDescriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ScoreCard } from "@/components/analysis/score-card";
import { KeywordBadges } from "@/components/analysis/keyword-badges";
import { ImprovementList } from "@/components/analysis/improvement-list";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, FileText, Building2 } from "lucide-react";
import Link from "next/link";

interface ResultsPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ResultsPageProps) {
    const { id } = await params;
    return {
        title: `Analysis Results | ResumeAI Pro`,
        description: `View AI-powered analysis results for analysis ${id}.`,
    };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const { id } = await params;

    // Fetch analysis with related resume and JD info
    const [analysis] = await db
        .select({
            id: analyses.id,
            compatibilityScore: analyses.compatibilityScore,
            atsScore: analyses.atsScore,
            matchedKeywords: analyses.matchedKeywords,
            missingKeywords: analyses.missingKeywords,
            executiveSummary: analyses.executiveSummary,
            improvements: analyses.improvements,
            processingTimeMs: analyses.processingTimeMs,
            createdAt: analyses.createdAt,
            resumeName: resumes.versionName,
            companyName: jobDescriptions.companyName,
            jobTitle: jobDescriptions.jobTitle,
        })
        .from(analyses)
        .leftJoin(resumes, eq(analyses.resumeId, resumes.id))
        .leftJoin(jobDescriptions, eq(analyses.jdId, jobDescriptions.id))
        .where(eq(analyses.id, id))
        .limit(1);

    if (!analysis) {
        notFound();
    }

    const score = analysis.compatibilityScore ?? 0;
    const atsScore = analysis.atsScore ?? 0;
    const matchedKeywords = (analysis.matchedKeywords as string[]) ?? [];
    const missingKeywords = (analysis.missingKeywords as string[]) ?? [];
    const improvements =
        (analysis.improvements as {
            section: string;
            currentText?: string;
            suggestedText: string;
            reasoning: string;
        }[]) ?? [];

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link
                    href="/upload"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    New Analysis
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
                        Analysis Results
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {analysis.resumeName && (
                            <span className="inline-flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                {analysis.resumeName}
                            </span>
                        )}
                        {analysis.companyName && (
                            <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                {analysis.companyName}
                                {analysis.jobTitle && ` · ${analysis.jobTitle}`}
                            </span>
                        )}
                        {analysis.processingTimeMs && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {(analysis.processingTimeMs / 1000).toFixed(1)}s
                            </span>
                        )}
                    </div>
                </div>

                {/* Score Cards */}
                <div className="grid gap-4 sm:grid-cols-2 mb-8">
                    <ScoreCard
                        score={score}
                        label="Compatibility Score"
                        subtitle="How well your resume matches the job description"
                        size="lg"
                    />
                    <ScoreCard
                        score={atsScore}
                        label="ATS Score"
                        subtitle="How well machines can read your resume"
                        size="lg"
                    />
                </div>

                {/* Executive Summary */}
                {analysis.executiveSummary && (
                    <Card className="mb-8 border-indigo-100 bg-indigo-50/30 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <Badge
                                    variant="secondary"
                                    className="bg-indigo-100 text-indigo-700 font-medium shrink-0 mt-0.5"
                                >
                                    Summary
                                </Badge>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    {analysis.executiveSummary}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Separator className="mb-8" />

                {/* Keyword Analysis */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">
                        Keyword Analysis
                    </h2>
                    <KeywordBadges
                        matchedKeywords={matchedKeywords}
                        missingKeywords={missingKeywords}
                    />
                </div>

                <Separator className="mb-8" />

                {/* Improvements */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">
                        Recommended Improvements
                    </h2>
                    <ImprovementList improvements={improvements} />
                </div>
            </div>
        </main>
    );
}
