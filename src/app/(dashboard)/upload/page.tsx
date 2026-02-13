import { UploadForm } from "@/components/forms/upload-form";
import { ArrowLeft, FileSearch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Upload Resume | ResumeAI Pro",
    description: "Upload your resume and paste a job description to get an AI-powered compatibility analysis.",
};

export default function UploadPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
                        <FileSearch className="h-4 w-4" />
                        Smart Resume Scanner
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
                        Analyze Your Resume
                    </h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Upload your resume and paste the job description. Our AI will analyze
                        keyword matches, ATS compatibility, and provide actionable improvements.
                    </p>
                </div>

                {/* Upload Form */}
                <UploadForm />
            </div>
        </main>
    );
}
