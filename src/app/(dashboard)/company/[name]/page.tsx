"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    MapPin,
    Users,
    Star,
    Loader2,
    Search,
    Newspaper,
    Cpu,
    Lightbulb,
    MessageSquare,
    ExternalLink,
    Sparkles,
    AlertTriangle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface CompanyData {
    companyName: string;
    industry: string | null;
    headquarters: string | null;
    description: string | null;
    glassdoorRating: string | null;
    interviewDifficulty: string | null;
    recentNews: { title: string; date: string; url: string }[] | null;
    techStack: string[] | null;
    cultureKeywords: string[] | null;
    employeeCount: number | null;
    whyJoin: string | null;
    interviewTips: string | null;
}

// ── Helpers ──────────────────────────────────────────────────

function getRatingColor(rating: number) {
    if (rating >= 4.0) return "text-emerald-600";
    if (rating >= 3.0) return "text-amber-600";
    return "text-red-500";
}

function getRatingBg(rating: number) {
    if (rating >= 4.0) return "bg-emerald-50 border-emerald-200";
    if (rating >= 3.0) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
}

function getDifficultyColor(d: string) {
    const l = d.toLowerCase();
    if (l === "easy") return "bg-emerald-100 text-emerald-700";
    if (l === "hard") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
}

const TECH_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-indigo-100 text-indigo-700",
    "bg-cyan-100 text-cyan-700",
    "bg-teal-100 text-teal-700",
    "bg-sky-100 text-sky-700",
];

const CULTURE_COLORS = [
    "bg-pink-100 text-pink-700",
    "bg-rose-100 text-rose-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-lime-100 text-lime-700",
];

// ── Page Component ───────────────────────────────────────────

export default function CompanyPage({
    params,
}: {
    params: Promise<{ name: string }>;
}) {
    const [companyName, setCompanyName] = useState("");
    const [data, setData] = useState<CompanyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [fromCache, setFromCache] = useState(false);

    // Auto-fill from URL param
    useState(() => {
        params.then((p) => {
            const decoded = decodeURIComponent(p.name).replace(/-/g, " ");
            setCompanyName(decoded);
        });
    });

    async function handleSearch(e?: React.FormEvent) {
        e?.preventDefault();
        if (!companyName.trim()) return;

        setIsLoading(true);
        setError("");
        setData(null);

        try {
            const res = await fetch("/api/company/enrich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyName: companyName.trim() }),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to fetch company data.");
            }

            const result = await res.json();
            setData(result.company);
            setFromCache(result.fromCache || false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setIsLoading(false);
        }
    }

    const rating = data?.glassdoorRating
        ? parseFloat(data.glassdoorRating)
        : null;

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-600 mb-3">
                        <Building2 className="h-4 w-4" />
                        Company Intelligence
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Know Your Target Company
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Get AI-powered insights, tech stack, culture, news, and interview
                        tips for any company.
                    </p>
                </div>

                {/* Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className="flex gap-2 mb-8"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter company name (e.g., Google, Microsoft, Infosys)"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !companyName.trim()}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-1" /> Analyze
                            </>
                        )}
                    </Button>
                </form>

                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-16 space-y-3">
                        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mx-auto" />
                        <p className="text-slate-600 font-medium">
                            Researching {companyName}...
                        </p>
                        <p className="text-xs text-slate-400">
                            Fetching news and generating AI profile
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <Card className="border-red-200 mb-6">
                        <CardContent className="p-4 flex items-center gap-3 text-red-600">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {data && !isLoading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Cache Badge */}
                        {fromCache && (
                            <p className="text-xs text-slate-400">
                                📦 Showing cached data. Profile refreshes every 30 days.
                            </p>
                        )}

                        {/* Top Row: Overview + Stats */}
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Company Overview */}
                            <Card className="md:col-span-2 border-slate-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-teal-500" />
                                        {data.companyName}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {data.description && (
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {data.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                        {data.industry && (
                                            <span className="flex items-center gap-1">
                                                <Cpu className="h-3.5 w-3.5" /> {data.industry}
                                            </span>
                                        )}
                                        {data.headquarters && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" /> {data.headquarters}
                                            </span>
                                        )}
                                        {data.employeeCount && (
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />{" "}
                                                {data.employeeCount.toLocaleString()} employees
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Rating Card */}
                            <Card className="border-slate-200">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                    {rating ? (
                                        <>
                                            <div
                                                className={`text-4xl font-bold mb-1 ${getRatingColor(
                                                    rating
                                                )}`}
                                            >
                                                {rating.toFixed(1)}
                                            </div>
                                            <div className="flex items-center gap-0.5 mb-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`h-4 w-4 ${s <= Math.round(rating)
                                                                ? "text-amber-400 fill-amber-400"
                                                                : "text-slate-200"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                Estimated Rating
                                            </p>
                                            {data.interviewDifficulty && (
                                                <Badge
                                                    className={`mt-3 ${getDifficultyColor(
                                                        data.interviewDifficulty
                                                    )}`}
                                                >
                                                    Interview: {data.interviewDifficulty}
                                                </Badge>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400">
                                            No rating available
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tech Stack + Culture */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Tech Stack */}
                            {data.techStack && data.techStack.length > 0 && (
                                <Card className="border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-blue-500" /> Tech Stack
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {data.techStack.map((tech, i) => (
                                                <Badge
                                                    key={tech}
                                                    className={TECH_COLORS[i % TECH_COLORS.length]}
                                                >
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Culture */}
                            {data.cultureKeywords && data.cultureKeywords.length > 0 && (
                                <Card className="border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4 text-amber-500" /> Culture
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {data.cultureKeywords.map((kw, i) => (
                                                <Badge
                                                    key={kw}
                                                    className={
                                                        CULTURE_COLORS[i % CULTURE_COLORS.length]
                                                    }
                                                >
                                                    {kw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Why Join + Interview Tips */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.whyJoin && (
                                <Card className="border-emerald-200 bg-emerald-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                                            <Sparkles className="h-4 w-4" /> Why You Should Join
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-emerald-800 leading-relaxed">
                                            {data.whyJoin}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {data.interviewTips && (
                                <Card className="border-indigo-200 bg-indigo-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                                            <MessageSquare className="h-4 w-4" /> Interview Tips
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-indigo-800 leading-relaxed">
                                            {data.interviewTips}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Recent News */}
                        {data.recentNews && data.recentNews.length > 0 && (
                            <Card className="border-slate-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Newspaper className="h-4 w-4 text-orange-500" /> Recent
                                        News
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {data.recentNews.map((article, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-3 text-sm"
                                            >
                                                <span className="text-xs text-slate-400 whitespace-nowrap mt-0.5">
                                                    {article.date}
                                                </span>
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-700 hover:text-teal-600 transition-colors flex items-center gap-1"
                                                >
                                                    {article.title}
                                                    <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-40" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!data && !isLoading && !error && (
                    <div className="text-center py-20">
                        <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">
                            Search for any company to get AI-powered intelligence
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
