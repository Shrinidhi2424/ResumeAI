import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3000";

interface ScrapedJob {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    url: string;
    scrapedAt: string;
}

interface AnalysisResult {
    analysisId: string;
    compatibility_score: number;
    ats_score: number;
    matched_keywords: string[];
    missing_keywords: string[];
    executive_summary: string;
}

type Status = "idle" | "scraping" | "analyzing" | "done" | "error";

export function Popup() {
    const [status, setStatus] = useState<Status>("idle");
    const [job, setJob] = useState<ScrapedJob | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");
    const [resumeId, setResumeId] = useState("");
    const [resumes, setResumes] = useState<{ id: string; versionName: string }[]>(
        []
    );

    // Fetch resumes on mount
    useEffect(() => {
        fetchResumes();
        loadStoredJob();
    }, []);

    async function fetchResumes() {
        try {
            const res = await fetch(`${API_BASE}/api/resumes`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setResumes(data.resumes || []);
                if (data.resumes?.length > 0) {
                    setResumeId(data.resumes[0].id);
                }
            }
        } catch {
            // User might not be logged in
        }
    }

    async function loadStoredJob() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: "GET_SCRAPED_JOB",
            });
            if (response?.data) {
                setJob(response.data);
            }
        } catch {
            // No stored job
        }
    }

    async function handleScrape() {
        setStatus("scraping");
        setError("");

        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (!tab?.id || !tab.url?.includes("linkedin.com")) {
                setError("Please navigate to a LinkedIn job posting.");
                setStatus("error");
                return;
            }

            const response = await chrome.tabs.sendMessage(tab.id, {
                type: "SCRAPE_JOB",
            });

            if (response?.success && response.data) {
                setJob(response.data);
                setStatus("idle");
            } else {
                setError(
                    "Could not find job details. Make sure you're on a job posting page."
                );
                setStatus("error");
            }
        } catch {
            setError(
                "Failed to scrape. Refresh the LinkedIn page and try again."
            );
            setStatus("error");
        }
    }

    async function handleAnalyze() {
        if (!job || !resumeId) return;

        setStatus("analyzing");
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    resumeId,
                    jobDescription: job.jobDescription,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Analysis failed.");
            }

            const data = await res.json();
            setResult(data);
            setStatus("done");

            // Clear badge
            chrome.runtime.sendMessage({ type: "CLEAR_BADGE" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed.");
            setStatus("error");
        }
    }

    function getScoreColor(score: number): string {
        if (score >= 70) return "#10b981";
        if (score >= 40) return "#f59e0b";
        return "#ef4444";
    }

    return (
        <div style={{ padding: "16px", maxWidth: "380px" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "12px",
                }}
            >
                <div
                    style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "#6366f1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "14px",
                    }}
                >
                    R
                </div>
                <div>
                    <h1
                        style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#1e293b",
                            lineHeight: 1.2,
                        }}
                    >
                        ResumeAI Pro
                    </h1>
                    <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                        LinkedIn Job Scanner
                    </p>
                </div>
            </div>

            {/* Resume Selector */}
            {resumes.length > 0 ? (
                <div style={{ marginBottom: "12px" }}>
                    <label
                        style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748b",
                            display: "block",
                            marginBottom: "4px",
                        }}
                    >
                        Resume
                    </label>
                    <select
                        value={resumeId}
                        onChange={(e) => setResumeId(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            fontSize: "13px",
                            backgroundColor: "white",
                        }}
                    >
                        {resumes.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.versionName}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div
                    style={{
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "#fef3c7",
                        fontSize: "12px",
                        color: "#92400e",
                        marginBottom: "12px",
                    }}
                >
                    No resumes found. Upload one at localhost:3000/upload first.
                </div>
            )}

            {/* Scrape Button */}
            {!job && (
                <button
                    onClick={handleScrape}
                    disabled={status === "scraping"}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#6366f1",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: status === "scraping" ? "wait" : "pointer",
                        opacity: status === "scraping" ? 0.7 : 1,
                    }}
                >
                    {status === "scraping" ? "⏳ Scraping..." : "🔍 Scan Current Job Page"}
                </button>
            )}

            {/* Scraped Job Info */}
            {job && (
                <div
                    style={{
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        marginBottom: "12px",
                    }}
                >
                    <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                        ✓ Job Detected
                    </div>
                    <p
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#1e293b",
                            marginTop: "4px",
                        }}
                    >
                        {job.jobTitle || "Unknown Position"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>
                        {job.companyName || "Unknown Company"}
                    </p>
                    <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                        {job.jobDescription.substring(0, 120)}...
                    </p>

                    {/* Analyze Button */}
                    {status !== "done" && (
                        <button
                            onClick={handleAnalyze}
                            disabled={!resumeId || status === "analyzing"}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor:
                                    status === "analyzing" ? "#94a3b8" : "#6366f1",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor:
                                    status === "analyzing" || !resumeId ? "wait" : "pointer",
                                marginTop: "10px",
                            }}
                        >
                            {status === "analyzing"
                                ? "⏳ Analyzing with AI..."
                                : "🚀 Analyze Resume Match"}
                        </button>
                    )}
                </div>
            )}

            {/* Results */}
            {result && (
                <div
                    style={{
                        padding: "14px",
                        borderRadius: "10px",
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                >
                    {/* Score Circles */}
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            justifyContent: "center",
                            marginBottom: "14px",
                        }}
                    >
                        <ScoreCircle
                            score={result.compatibility_score}
                            label="Match"
                            color={getScoreColor(result.compatibility_score)}
                        />
                        <ScoreCircle
                            score={result.ats_score}
                            label="ATS"
                            color={getScoreColor(result.ats_score)}
                        />
                    </div>

                    {/* Summary */}
                    <p
                        style={{
                            fontSize: "12px",
                            color: "#475569",
                            lineHeight: 1.5,
                            marginBottom: "12px",
                            padding: "8px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "6px",
                        }}
                    >
                        {result.executive_summary}
                    </p>

                    {/* Keywords */}
                    <div style={{ marginBottom: "10px" }}>
                        <p
                            style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a" }}
                        >
                            ✓ Matched ({result.matched_keywords.length})
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                marginTop: "4px",
                            }}
                        >
                            {result.matched_keywords.slice(0, 8).map((kw) => (
                                <span
                                    key={kw}
                                    style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        backgroundColor: "#dcfce7",
                                        color: "#166534",
                                    }}
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626" }}>
                            ✗ Missing ({result.missing_keywords.length})
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                marginTop: "4px",
                            }}
                        >
                            {result.missing_keywords.slice(0, 8).map((kw) => (
                                <span
                                    key={kw}
                                    style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        backgroundColor: "#fee2e2",
                                        color: "#991b1b",
                                    }}
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* View Full Results */}
                    <a
                        href={`${API_BASE}/results/${result.analysisId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "block",
                            textAlign: "center",
                            marginTop: "14px",
                            padding: "8px",
                            borderRadius: "6px",
                            backgroundColor: "#f1f5f9",
                            color: "#6366f1",
                            fontWeight: 600,
                            fontSize: "12px",
                            textDecoration: "none",
                        }}
                    >
                        View Full Results →
                    </a>
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        fontSize: "12px",
                        color: "#dc2626",
                        marginTop: "12px",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Rescrape */}
            {job && status !== "scraping" && (
                <button
                    onClick={() => {
                        setJob(null);
                        setResult(null);
                        setStatus("idle");
                    }}
                    style={{
                        width: "100%",
                        padding: "8px",
                        marginTop: "10px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "transparent",
                        color: "#64748b",
                        fontSize: "12px",
                        cursor: "pointer",
                    }}
                >
                    ↻ Scan a Different Job
                </button>
            )}
        </div>
    );
}

/**
 * Simple SVG score circle for the popup.
 */
function ScoreCircle({
    score,
    label,
    color,
}: {
    score: number;
    label: string;
    color: string;
}) {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    return (
        <div style={{ textAlign: "center" }}>
            <svg width="76" height="76" viewBox="0 0 76 76">
                <circle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                />
                <circle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    transform="rotate(-90 38 38)"
                    style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
                <text
                    x="38"
                    y="36"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill={color}
                >
                    {score}
                </text>
                <text x="38" y="50" textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {label}
                </text>
            </svg>
        </div>
    );
}
