"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, X, Sparkles } from "lucide-react";

/**
 * Upload form with drag-and-drop PDF + job description textarea.
 * Posts to /api/resumes/upload, then calls /api/analyze.
 */
export function UploadForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError(null);
        const pdf = acceptedFiles[0];
        if (pdf && pdf.type === "application/pdf") {
            if (pdf.size > 10 * 1024 * 1024) {
                setError("File too large. Maximum size is 10MB.");
                return;
            }
            setFile(pdf);
        } else {
            setError("Please upload a PDF file.");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        multiple: false,
    });

    const removeFile = () => {
        setFile(null);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Please upload your resume PDF.");
            return;
        }
        if (!jobDescription.trim() || jobDescription.trim().length < 20) {
            setError("Please paste a job description (at least 20 characters).");
            return;
        }

        setError(null);

        try {
            // Step 1: Upload resume
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("versionName", file.name.replace(".pdf", ""));

            const uploadRes = await fetch("/api/resumes/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const data = await uploadRes.json();
                throw new Error(data.error || "Upload failed.");
            }

            const uploadData = await uploadRes.json();
            setUploading(false);

            // Step 2: Analyze
            setAnalyzing(true);
            const analyzeRes = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeId: uploadData.resumeId,
                    jobDescription: jobDescription.trim(),
                }),
            });

            if (!analyzeRes.ok) {
                const data = await analyzeRes.json();
                throw new Error(data.error || "Analysis failed.");
            }

            const analyzeData = await analyzeRes.json();
            setAnalyzing(false);

            // Navigate to results
            router.push(`/results/${analyzeData.analysisId}`);
        } catch (err) {
            setUploading(false);
            setAnalyzing(false);
            setError(err instanceof Error ? err.message : "Something went wrong.");
        }
    };

    const isProcessing = uploading || analyzing;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Dropzone */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Upload Your Resume
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`
                cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200
                ${isDragActive
                                    ? "border-indigo-400 bg-indigo-50/70 scale-[1.01]"
                                    : "border-slate-300 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"
                                }
              `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className={`rounded-full p-4 transition-colors ${isDragActive ? "bg-indigo-100" : "bg-slate-100"
                                        }`}
                                >
                                    <Upload
                                        className={`h-8 w-8 ${isDragActive ? "text-indigo-500" : "text-slate-400"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">
                                        {isDragActive
                                            ? "Drop your PDF here..."
                                            : "Drag & drop your resume PDF"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        or click to browse · PDF only · Max 10MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-100 p-2">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeFile}
                                className="text-slate-400 hover:text-red-500"
                                disabled={isProcessing}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                    <Label
                        htmlFor="job-description"
                        className="text-sm font-medium text-slate-700"
                    >
                        Paste the Job Description
                    </Label>
                </CardHeader>
                <CardContent className="pt-0">
                    <Textarea
                        id="job-description"
                        placeholder="Paste the complete job description here... (requirements, qualifications, responsibilities)"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="min-h-[180px] resize-y border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white"
                        disabled={isProcessing}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                        {jobDescription.length} characters ·{" "}
                        {jobDescription.length < 20
                            ? "Minimum 20 characters required"
                            : "✓ Ready"}
                    </p>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={!file || jobDescription.trim().length < 20 || isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-6 text-base shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/25"
                size="lg"
            >
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Uploading Resume...
                    </>
                ) : analyzing ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing with AI...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Analyze Resume
                    </>
                )}
            </Button>
        </div>
    );
}
