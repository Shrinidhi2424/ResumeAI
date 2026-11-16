import { db } from "@/lib/db";
import { analyses, resumes, jobDescriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ScoreCard } from "@/components/analysis/score-card";
import { KeywordBadges } from "@/components/analysis/keyword-badges";
import { ImprovementList } from "@/components/analysis/improvement-list";
import { HeatmapSection } from "@/components/analysis/heatmap-section";
import { generateHeatmapFromAnalysis } from "@/lib/pdf/heatmap";
import { scoreKeywordCoverage } from "@/lib/scoring/keyword-match";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, FileText, Building2, AlertTriangle } from "lucide-react";
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
    const { userId } = await auth();

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
            heatmapData: analyses.heatmapData,
            processingTimeMs: analyses.processingTimeMs,
            createdAt: analyses.createdAt,
            resumeName: resumes.versionName,
            resumeFileUrl: resumes.fileUrl,
            resumeOwnerId: resumes.userId,
            resumeText: resumes.parsedText,
            companyName: jobDescriptions.companyName,
            jobDescription: jobDescriptions.description,
            jobTitle: jobDescriptions.jobTitle,
        })
        .from(analyses)
        .leftJoin(resumes, eq(analyses.resumeId, resumes.id))
        .leftJoin(jobDescriptions, eq(analyses.jdId, jobDescriptions.id))
        .where(eq(analyses.id, id))
        .limit(1);

    // Only the resume's owner may see the analysis (it includes the resume PDF).
    if (!analysis || !userId || analysis.resumeOwnerId !== userId) {
        notFound();
    }

    // The AI path always stores an ATS score; only the keyword-only fallback leaves it null.
    const isKeywordOnly = analysis.atsScore === null;
    // Keyword coverage is not stored (no schema change), so recompute it here.
    // It is a pure function of resume text + JD, so the result is the same as at analysis time.
    const coverage =
        analysis.resumeText && analysis.jobDescription
            ? scoreKeywordCoverage(analysis.resumeText, analysis.jobDescription)
            : null;
    const matchedKeywords = (analysis.matchedKeywords as string[]) ?? [];
    const missingKeywords = (analysis.missingKeywords as string[]) ?? [];
    const improvements =
        (analysis.improvements as {
            section: string;
            currentText?: string;
            suggestedText: string;
            reasoning: string;
        }[]) ?? [];
    // Heatmap points cover page 1 of the PDF only (see src/lib/pdf/text-items.ts).
    const heatmapPoints = analysis.heatmapData
        ? generateHeatmapFromAnalysis(analysis.heatmapData)
        : [];

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

                {/* Keyword-only banner */}
                {isKeywordOnly && (
                    <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                            AI analysis was unavailable for this scan. Scores come from the
                            deterministic keyword matcher only; there is no ATS score or
                            improvement list.
                        </p>
                    </div>
                )}

                {/* Score Cards */}
                <div className="grid gap-4 sm:grid-cols-3 mb-8">
                    {analysis.compatibilityScore !== null ? (
                        <ScoreCard
                            score={analysis.compatibilityScore}
                            label="Compatibility Score"
                            subtitle={
                                isKeywordOnly
                                    ? "Keyword coverage (AI unavailable)"
                                    : "How well your resume matches the job description"
                            }
                            size="md"
                        />
                    ) : (
                        <UnavailableScore label="Compatibility Score" reason="Not enough known skills in the job description." />
                    )}
                    {analysis.atsScore !== null ? (
                        <ScoreCard
                            score={analysis.atsScore}
                            label="ATS Score"
                            subtitle="How well machines can read your resume"
                            size="md"
                        />
                    ) : (
                        <UnavailableScore label="ATS Score" reason="Needs AI analysis." />
                    )}
                    {coverage && coverage.score !== null ? (
                        <ScoreCard
                            score={coverage.score}
                            label="Keyword coverage (deterministic)"
                            subtitle={`${coverage.matched.length} of ${coverage.total} known skills in the job description appear in your resume`}
                            size="md"
                        />
                    ) : (
                        <UnavailableScore
                            label="Keyword coverage (deterministic)"
                            reason={coverage?.reason ?? "Resume text or job description not available."}
                        />
                    )}
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

                {/* Recruiter Heatmap (page 1 only) */}
                {analysis.resumeFileUrl && heatmapPoints.length > 0 && (
                    <>
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">
                                Recruiter Heatmap
                            </h2>
                            <HeatmapSection
                                fileUrl={analysis.resumeFileUrl}
                                heatmapData={heatmapPoints}
                            />
                        </div>
                        <Separator className="mb-8" />
                    </>
                )}

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

/** Placeholder card for a score that could not be computed. */
function UnavailableScore({ label, reason }: { label: string; reason: string }) {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-300">n/a</p>
                <p className="mt-2 text-xs text-slate-500">{reason}</p>
            </CardContent>
        </Card>
    );
}
