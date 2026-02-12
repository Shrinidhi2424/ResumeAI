"use client";

import { useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    FileText,
    Sparkles,
    Loader2,
    Copy,
    Check,
    Download,
} from "lucide-react";

type Tone = "professional" | "enthusiastic" | "technical";

interface Resume {
    id: string;
    versionName: string;
}

export default function CoverLetterPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyNews, setCompanyNews] = useState("");
    const [tone, setTone] = useState<Tone>("professional");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Vercel AI SDK streaming hook
    const { completion, complete, isLoading } = useCompletion({
        api: "/api/cover-letter/generate",
        onError: (err: Error) => {
            setError(err.message || "Failed to generate cover letter.");
        },
    });

    // Fetch user's resumes on mount
    useEffect(() => {
        async function fetchResumes() {
            try {
                const res = await fetch("/api/resumes");
                if (res.ok) {
                    const data = await res.json();
                    setResumes(data.resumes || []);
                }
            } catch {
                // silently fail — user can still paste resume text
            }
        }
        fetchResumes();
    }, []);

    const handleGenerate = async () => {
        if (!selectedResumeId) {
            setError("Please select a resume.");
            return;
        }
        if (!jobDescription.trim()) {
            setError("Please paste the job description.");
            return;
        }
        if (!companyName.trim()) {
            setError("Please enter the company name.");
            return;
        }

        setError(null);

        await complete("", {
            body: {
                resumeId: selectedResumeId,
                jobDescription: jobDescription.trim(),
                companyName: companyName.trim(),
                companyNews: companyNews.trim(),
                tone,
            },
        });
    };

    const handleCopy = async () => {
        if (completion) {
            await navigator.clipboard.writeText(completion);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!completion) return;
        const blob = new Blob([completion], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cover-letter-${companyName.replace(/\s+/g, "-").toLowerCase()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const tones: { value: Tone; label: string; emoji: string; desc: string }[] = [
        {
            value: "professional",
            label: "Professional",
            emoji: "🏢",
            desc: "Formal and corporate",
        },
        {
            value: "enthusiastic",
            label: "Enthusiastic",
            emoji: "🚀",
            desc: "Energetic and startup-friendly",
        },
        {
            value: "technical",
            label: "Technical",
            emoji: "⚙️",
            desc: "Focus on technical skills",
        },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
                        <FileText className="h-4 w-4" />
                        AI Cover Letter Generator
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
                        Generate a Cover Letter
                    </h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Select your resume, paste the job description, and let AI craft a
                        personalized cover letter in real-time.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left: Input Form */}
                    <div className="space-y-5">
                        {/* Resume Selector */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <Label className="text-sm font-medium text-slate-700">
                                    Select Resume
                                </Label>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <select
                                    value={selectedResumeId}
                                    onChange={(e) => setSelectedResumeId(e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={isLoading}
                                >
                                    <option value="">Choose a resume...</option>
                                    {resumes.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.versionName}
                                        </option>
                                    ))}
                                </select>
                            </CardContent>
                        </Card>

                        {/* Company Name */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <Label className="text-sm font-medium text-slate-700">
                                    Company Name
                                </Label>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="e.g. Google, Infosys, TCS..."
                                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                                    disabled={isLoading}
                                />
                            </CardContent>
                        </Card>

                        {/* Job Description */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <Label className="text-sm font-medium text-slate-700">
                                    Job Description
                                </Label>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the complete job description here..."
                                    className="min-h-[140px] resize-y border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white"
                                    disabled={isLoading}
                                />
                            </CardContent>
                        </Card>

                        {/* Company News (Optional) */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <Label className="text-sm font-medium text-slate-700">
                                    Recent Company News{" "}
                                    <span className="text-slate-400 font-normal">(optional)</span>
                                </Label>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Textarea
                                    value={companyNews}
                                    onChange={(e) => setCompanyNews(e.target.value)}
                                    placeholder="Any recent news, product launches, or company updates..."
                                    className="min-h-[80px] resize-y border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white"
                                    disabled={isLoading}
                                />
                            </CardContent>
                        </Card>

                        {/* Tone Selector */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <Label className="text-sm font-medium text-slate-700">
                                    Tone
                                </Label>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-3 gap-3">
                                    {tones.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setTone(t.value)}
                                            disabled={isLoading}
                                            className={`
                        rounded-lg border p-3 text-center transition-all
                        ${tone === t.value
                                                    ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500/20"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                                }
                      `}
                                        >
                                            <div className="text-xl mb-1">{t.emoji}</div>
                                            <div className="text-xs font-medium text-slate-700">
                                                {t.label}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                {t.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={
                                isLoading ||
                                !selectedResumeId ||
                                !jobDescription.trim() ||
                                !companyName.trim()
                            }
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-5 text-base shadow-lg shadow-indigo-500/20"
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Generate Cover Letter
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right: Live Output */}
                    <div className="lg:sticky lg:top-8 h-fit">
                        <Card className="border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold text-slate-800">
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                                Writing...
                                            </span>
                                        ) : completion ? (
                                            "Your Cover Letter"
                                        ) : (
                                            "Preview"
                                        )}
                                    </CardTitle>
                                    {completion && !isLoading && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCopy}
                                                className="text-slate-500 hover:text-indigo-600"
                                            >
                                                {copied ? (
                                                    <Check className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleDownload}
                                                className="text-slate-500 hover:text-indigo-600"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-5">
                                {completion ? (
                                    <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
                                        {completion}
                                        {isLoading && (
                                            <span className="inline-block w-1.5 h-5 bg-indigo-500 animate-pulse ml-0.5 rounded-sm" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                                        <div className="rounded-full bg-slate-100 p-4 mb-4">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            Your cover letter will appear here in real-time
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1">
                                            Fill in the form and click Generate
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
