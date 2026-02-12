"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Mic,
    MicOff,
    Send,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    RotateCcw,
    Brain,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface Question {
    id: string;
    question: string;
    category: "technical" | "behavioral" | "situational";
    difficulty: "easy" | "medium" | "hard";
    userAnswer: string | null;
    aiFeedback: string | null;
    score: number | null;
}

interface FeedbackResult {
    score: number;
    feedback: string;
    strengths: string;
    improvement: string;
}

// ── Page Component ───────────────────────────────────────────

export default function InterviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [analysisId, setAnalysisId] = useState<string>("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<Record<string, FeedbackResult>>({});
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState("");

    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Resolve params
    useEffect(() => {
        params.then((p) => setAnalysisId(p.id));
    }, [params]);

    // ── Generate / Fetch Questions ─────────────────────────────

    useEffect(() => {
        if (!analysisId) return;

        async function fetchQuestions() {
            setIsLoading(true);
            setError("");
            try {
                const res = await fetch("/api/interview/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ analysisId }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to generate questions.");
                }

                const data = await res.json();
                setQuestions(data.questions);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load questions."
                );
            } finally {
                setIsLoading(false);
            }
        }

        fetchQuestions();
    }, [analysisId]);

    // ── Speech Recognition ─────────────────────────────────────

    const toggleSpeech = useCallback(() => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setAnswer((prev) => {
                // If there was existing text, append after a space
                const base = prev.endsWith(" ") || prev === "" ? prev : prev + " ";
                return base + transcript;
            });
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [isListening]);

    // ── Submit Answer ──────────────────────────────────────────

    async function handleSubmit() {
        const question = questions[currentIndex];
        if (!question || !answer.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/interview/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: question.id,
                    userAnswer: answer.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Feedback failed.");
            }

            const result: FeedbackResult = await res.json();
            setFeedback((prev) => ({ ...prev, [question.id]: result }));

            // Update question in local state
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === question.id
                        ? { ...q, userAnswer: answer.trim(), score: result.score }
                        : q
                )
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to get feedback."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    // ── Helpers ────────────────────────────────────────────────

    const currentQuestion = questions[currentIndex];
    const currentFeedback = currentQuestion
        ? feedback[currentQuestion.id]
        : null;
    const isAnswered = !!currentFeedback;
    const totalAnswered = questions.filter((q) => feedback[q.id]).length;

    function getScoreColor(score: number) {
        if (score >= 8) return "text-emerald-500";
        if (score >= 5) return "text-amber-500";
        return "text-red-500";
    }

    function getScoreBg(score: number) {
        if (score >= 8) return "bg-emerald-50 border-emerald-200";
        if (score >= 5) return "bg-amber-50 border-amber-200";
        return "bg-red-50 border-red-200";
    }

    function getCategoryColor(cat: string) {
        if (cat === "technical") return "bg-blue-100 text-blue-700";
        if (cat === "behavioral") return "bg-violet-100 text-violet-700";
        return "bg-amber-100 text-amber-700";
    }

    function getDifficultyColor(diff: string) {
        if (diff === "easy") return "bg-emerald-100 text-emerald-700";
        if (diff === "medium") return "bg-amber-100 text-amber-700";
        return "bg-red-100 text-red-700";
    }

    // ── Loading State ──────────────────────────────────────────

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-600 font-medium">
                        Generating interview questions...
                    </p>
                    <p className="text-sm text-slate-400">
                        AI is analyzing your resume to create targeted questions
                    </p>
                </div>
            </main>
        );
    }

    if (error && questions.length === 0) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Card className="max-w-md border-red-200">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    // ── Main UI ────────────────────────────────────────────────

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 mb-3">
                        <Brain className="h-4 w-4" />
                        Mock Interview
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        AI Interview Practice
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Answer each question, then get instant AI feedback and scoring.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                        <span>
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        <span>
                            {totalAnswered}/{questions.length} answered
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{
                                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                            }}
                        />
                    </div>

                    {/* Question Dots */}
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                        {questions.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => {
                                    setCurrentIndex(i);
                                    setAnswer("");
                                }}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-all
                  ${i === currentIndex
                                        ? "bg-indigo-500 text-white scale-110"
                                        : feedback[q.id]
                                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                            >
                                {feedback[q.id] ? "✓" : i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question Card */}
                {currentQuestion && (
                    <Card className="border-slate-200 shadow-sm mb-6">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className={getCategoryColor(currentQuestion.category)}>
                                    {currentQuestion.category}
                                </Badge>
                                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                                    {currentQuestion.difficulty}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg text-slate-800 leading-relaxed">
                                {currentQuestion.question}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Answer Area */}
                            {!isAnswered ? (
                                <>
                                    <div className="relative">
                                        <Textarea
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="Type your answer here, or use the microphone to speak..."
                                            rows={6}
                                            className="resize-none pr-12 text-sm"
                                        />
                                        <button
                                            onClick={toggleSpeech}
                                            className={`absolute top-3 right-3 p-2 rounded-full transition-all
                        ${isListening
                                                    ? "bg-red-100 text-red-500 animate-pulse"
                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                }`}
                                            title={isListening ? "Stop recording" : "Start voice input"}
                                        >
                                            {isListening ? (
                                                <MicOff className="h-4 w-4" />
                                            ) : (
                                                <Mic className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {isListening && (
                                        <p className="text-xs text-red-500 animate-pulse flex items-center gap-1">
                                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                                            Listening... Speak your answer
                                        </p>
                                    )}

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!answer.trim() || isSubmitting}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Getting AI Feedback...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Answer
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                // ── Feedback Display ──────────────────────────
                                <div className="space-y-4">
                                    {/* User's Answer */}
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="text-xs font-medium text-slate-500 mb-1">
                                            Your Answer
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            {currentQuestion.userAnswer || answer}
                                        </p>
                                    </div>

                                    {/* Score */}
                                    <div
                                        className={`flex items-center gap-4 p-4 rounded-lg border ${getScoreBg(
                                            currentFeedback!.score
                                        )}`}
                                    >
                                        <div className="text-center">
                                            <p
                                                className={`text-3xl font-bold ${getScoreColor(
                                                    currentFeedback!.score
                                                )}`}
                                            >
                                                {currentFeedback!.score}
                                            </p>
                                            <p className="text-xs text-slate-500">/ 10</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">
                                                {currentFeedback!.feedback}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Strengths & Improvement */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                            <p className="text-xs font-semibold text-emerald-600 mb-1">
                                                ✓ Strengths
                                            </p>
                                            <p className="text-sm text-emerald-800">
                                                {currentFeedback!.strengths}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                            <p className="text-xs font-semibold text-amber-600 mb-1">
                                                → To Improve
                                            </p>
                                            <p className="text-sm text-amber-800">
                                                {currentFeedback!.improvement}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Retry */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setFeedback((prev) => {
                                                const next = { ...prev };
                                                delete next[currentQuestion.id];
                                                return next;
                                            });
                                            setAnswer("");
                                        }}
                                        className="text-xs"
                                    >
                                        <RotateCcw className="h-3 w-3 mr-1" /> Try Again
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        disabled={currentIndex === 0}
                        onClick={() => {
                            setCurrentIndex((i) => i - 1);
                            setAnswer("");
                        }}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>

                    {currentIndex < questions.length - 1 ? (
                        <Button
                            onClick={() => {
                                setCurrentIndex((i) => i + 1);
                                setAnswer("");
                            }}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={totalAnswered < questions.length}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Complete Interview
                        </Button>
                    )}
                </div>

                {/* Error Toast */}
                {error && questions.length > 0 && (
                    <div className="fixed bottom-4 right-4 max-w-sm p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 shadow-lg">
                        {error}
                        <button
                            onClick={() => setError("")}
                            className="ml-2 text-red-400 hover:text-red-600"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
