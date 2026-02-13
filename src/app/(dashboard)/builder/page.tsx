"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Save,
    Download,
    Plus,
    Trash2,
    Loader2,
    FileText,
    Eye,
    PenLine,
    CheckCircle2,
    GripVertical,
    ArrowLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface ResumeSection {
    id: string;
    title: string;
    institution?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    bullets: string[];
    degree?: string;
    gpa?: string;
}

interface PersonalInfo {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
}

interface ResumeState {
    personalInfo: PersonalInfo;
    summary: string;
    experience: ResumeSection[];
    education: ResumeSection[];
    skills: string[];
    projects: ResumeSection[];
    certifications: string[];
}

const EMPTY_SECTION: () => ResumeSection = () => ({
    id: crypto.randomUUID(),
    title: "",
    company: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    bullets: [""],
    degree: "",
    gpa: "",
});

const INITIAL_STATE: ResumeState = {
    personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        portfolio: "",
    },
    summary: "",
    experience: [EMPTY_SECTION()],
    education: [EMPTY_SECTION()],
    skills: [],
    projects: [],
    certifications: [],
};

// ── Components ───────────────────────────────────────────────

function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
        </div>
    );
}

interface SectionEditorProps {
    type: "experience" | "education" | "projects";
    items: ResumeSection[];
    isEducation?: boolean;
    onUpdate: (type: "experience" | "education" | "projects", id: string, field: string, value: string) => void;
    onRemove: (type: "experience" | "education" | "projects", id: string) => void;
    onAddBullet: (type: "experience" | "education" | "projects", sectionId: string) => void;
    onUpdateBullet: (type: "experience" | "education" | "projects", sectionId: string, bulletIndex: number, value: string) => void;
    onRemoveBullet: (type: "experience" | "education" | "projects", sectionId: string, bulletIndex: number) => void;
    onAddSection: (type: "experience" | "education" | "projects") => void;
}

function SectionEditor({
    type,
    items,
    isEducation,
    onUpdate,
    onRemove,
    onAddBullet,
    onUpdateBullet,
    onRemoveBullet,
    onAddSection,
}: SectionEditorProps) {
    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div
                    key={item.id}
                    className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <GripVertical className="h-3 w-3" /> #{idx + 1}
                        </span>
                        {items.length > 1 && (
                            <button
                                onClick={() => onRemove(type, item.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {isEducation ? (
                            <>
                                <Input
                                    label="Degree"
                                    value={item.degree || ""}
                                    onChange={(v) => onUpdate(type, item.id, "degree", v)}
                                    placeholder="B.Tech Computer Science"
                                />
                                <Input
                                    label="Institution"
                                    value={item.institution || ""}
                                    onChange={(v) =>
                                        onUpdate(type, item.id, "institution", v)
                                    }
                                    placeholder="MIT"
                                />
                                <Input
                                    label="GPA"
                                    value={item.gpa || ""}
                                    onChange={(v) => onUpdate(type, item.id, "gpa", v)}
                                    placeholder="3.8/4.0"
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    label={type === "projects" ? "Project Name" : "Job Title"}
                                    value={item.title}
                                    onChange={(v) => onUpdate(type, item.id, "title", v)}
                                    placeholder={
                                        type === "projects"
                                            ? "E-Commerce Platform"
                                            : "Software Engineer"
                                    }
                                />
                                {type === "experience" && (
                                    <Input
                                        label="Company"
                                        value={item.company || ""}
                                        onChange={(v) =>
                                            onUpdate(type, item.id, "company", v)
                                        }
                                        placeholder="Google"
                                    />
                                )}
                            </>
                        )}

                        <Input
                            label="Location"
                            value={item.location || ""}
                            onChange={(v) => onUpdate(type, item.id, "location", v)}
                            placeholder="San Francisco, CA"
                        />
                        <Input
                            label="Start Date"
                            value={item.startDate || ""}
                            onChange={(v) =>
                                onUpdate(type, item.id, "startDate", v)
                            }
                            placeholder="Jan 2023"
                        />
                        <Input
                            label="End Date"
                            value={item.endDate || ""}
                            onChange={(v) =>
                                onUpdate(type, item.id, "endDate", v)
                            }
                            placeholder="Present"
                        />
                    </div>

                    {/* Bullet Points */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Bullet Points
                        </label>
                        {item.bullets.map((b, bi) => (
                            <div key={bi} className="flex gap-1 mb-1.5">
                                <span className="text-slate-300 mt-2 text-xs">•</span>
                                <input
                                    value={b}
                                    onChange={(e) =>
                                        onUpdateBullet(type, item.id, bi, e.target.value)
                                    }
                                    placeholder="Describe your achievement with metrics..."
                                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                                {item.bullets.length > 1 && (
                                    <button
                                        onClick={() => onRemoveBullet(type, item.id, bi)}
                                        className="text-red-300 hover:text-red-500 px-1"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => onAddBullet(type, item.id)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" /> Add bullet
                        </button>
                    </div>
                </div>
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onAddSection(type)}
                className="w-full border-dashed"
            >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add{" "}
                {type === "experience"
                    ? "Experience"
                    : type === "education"
                        ? "Education"
                        : "Project"}
            </Button>
        </div>
    );
}

// ── Tab Config ─────────────────────────────────────────────

const tabs = [
    { id: "personal" as const, label: "Personal" },
    { id: "summary" as const, label: "Summary" },
    { id: "experience" as const, label: "Experience" },
    { id: "education" as const, label: "Education" },
    { id: "skills" as const, label: "Skills" },
    { id: "projects" as const, label: "Projects" },
    { id: "certs" as const, label: "Certs" },
];

// ── Page Component ───────────────────────────────────────────

export default function BuilderPage() {
    const [resume, setResume] = useState<ResumeState>(INITIAL_STATE);
    const [versionName, setVersionName] = useState("My Resume");
    const [activeTab, setActiveTab] = useState<
        "personal" | "summary" | "experience" | "education" | "skills" | "projects" | "certs"
    >("personal");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [skillInput, setSkillInput] = useState("");
    const [certInput, setCertInput] = useState("");
    const previewRef = useRef<HTMLDivElement>(null);

    // ── Updaters ───────────────────────────────────────────────

    function updatePersonal(
        field: keyof PersonalInfo,
        value: string
    ) {
        setResume((prev) => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value },
        }));
    }

    function updateSection(
        type: "experience" | "education" | "projects",
        id: string,
        field: string,
        value: string
    ) {
        setResume((prev) => ({
            ...prev,
            [type]: prev[type].map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        }));
    }

    function updateBullet(
        type: "experience" | "education" | "projects",
        sectionId: string,
        bulletIndex: number,
        value: string
    ) {
        setResume((prev) => ({
            ...prev,
            [type]: prev[type].map((s) =>
                s.id === sectionId
                    ? {
                        ...s,
                        bullets: s.bullets.map((b, i) =>
                            i === bulletIndex ? value : b
                        ),
                    }
                    : s
            ),
        }));
    }

    function addBullet(
        type: "experience" | "education" | "projects",
        sectionId: string
    ) {
        setResume((prev) => ({
            ...prev,
            [type]: prev[type].map((s) =>
                s.id === sectionId ? { ...s, bullets: [...s.bullets, ""] } : s
            ),
        }));
    }

    function removeBullet(
        type: "experience" | "education" | "projects",
        sectionId: string,
        bulletIndex: number
    ) {
        setResume((prev) => ({
            ...prev,
            [type]: prev[type].map((s) =>
                s.id === sectionId
                    ? { ...s, bullets: s.bullets.filter((_, i) => i !== bulletIndex) }
                    : s
            ),
        }));
    }

    function addSection(type: "experience" | "education" | "projects") {
        setResume((prev) => ({
            ...prev,
            [type]: [...prev[type], EMPTY_SECTION()],
        }));
    }

    function removeSection(
        type: "experience" | "education" | "projects",
        id: string
    ) {
        setResume((prev) => ({
            ...prev,
            [type]: prev[type].filter((s) => s.id !== id),
        }));
    }

    function addSkill() {
        if (skillInput.trim() && !resume.skills.includes(skillInput.trim())) {
            setResume((prev) => ({
                ...prev,
                skills: [...prev.skills, skillInput.trim()],
            }));
            setSkillInput("");
        }
    }

    function removeSkill(skill: string) {
        setResume((prev) => ({
            ...prev,
            skills: prev.skills.filter((s) => s !== skill),
        }));
    }

    function addCert() {
        if (certInput.trim()) {
            setResume((prev) => ({
                ...prev,
                certifications: [...prev.certifications, certInput.trim()],
            }));
            setCertInput("");
        }
    }

    function removeCert(index: number) {
        setResume((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index),
        }));
    }

    // ── Save ───────────────────────────────────────────────────

    async function handleSave() {
        setIsSaving(true);
        setSaved(false);
        try {
            const res = await fetch("/api/resumes/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ versionName, resumeData: resume }),
            });
            if (!res.ok) throw new Error("Save failed");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert("Failed to save resume.");
        } finally {
            setIsSaving(false);
        }
    }

    // ── Download PDF ───────────────────────────────────────────

    function handleDownloadPDF() {
        const content = previewRef.current;
        if (!content) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${versionName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
          .contact { font-size: 11px; color: #64748b; margin-bottom: 16px; }
          h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #334155; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin: 16px 0 8px; }
          h3 { font-size: 13px; font-weight: 600; }
          .meta { font-size: 11px; color: #64748b; margin-bottom: 4px; }
          p, li { font-size: 12px; line-height: 1.5; color: #475569; }
          ul { padding-left: 16px; margin: 4px 0 12px; }
          .skills { display: flex; flex-wrap: wrap; gap: 6px; }
          .skill { font-size: 11px; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
          @media print { body { padding: 20px; } @page { margin: 0.5in; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }



    // ── Main Render ────────────────────────────────────────────

    const p = resume.personalInfo;

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-7xl px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-600 mb-2">
                            <PenLine className="h-4 w-4" />
                            Resume Builder
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                value={versionName}
                                onChange={(e) => setVersionName(e.target.value)}
                                className="text-xl font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                                placeholder="Resume Name"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownloadPDF}>
                            <Download className="h-4 w-4 mr-1" /> PDF
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-violet-600 hover:bg-violet-700"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : saved ? (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                            ) : (
                                <Save className="h-4 w-4 mr-1" />
                            )}
                            {saved ? "Saved!" : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Two-Column Layout */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* LEFT: Editor */}
                    <div>
                        {/* Tabs */}
                        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? "bg-violet-100 text-violet-700"
                                        : "text-slate-500 hover:bg-slate-100"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <Card className="border-slate-200">
                            <CardContent className="p-5 space-y-4">
                                {/* ── Personal Info ────────────────────── */}
                                {activeTab === "personal" && (
                                    <div className="space-y-3">
                                        <Input
                                            label="Full Name"
                                            value={p.fullName}
                                            onChange={(v) => updatePersonal("fullName", v)}
                                            placeholder="John Doe"
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Input
                                                label="Email"
                                                value={p.email}
                                                onChange={(v) => updatePersonal("email", v)}
                                                placeholder="john@example.com"
                                                type="email"
                                            />
                                            <Input
                                                label="Phone"
                                                value={p.phone}
                                                onChange={(v) => updatePersonal("phone", v)}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                        </div>
                                        <Input
                                            label="Location"
                                            value={p.location}
                                            onChange={(v) => updatePersonal("location", v)}
                                            placeholder="San Francisco, CA"
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Input
                                                label="LinkedIn (optional)"
                                                value={p.linkedin}
                                                onChange={(v) => updatePersonal("linkedin", v)}
                                                placeholder="linkedin.com/in/johndoe"
                                            />
                                            <Input
                                                label="GitHub (optional)"
                                                value={p.github}
                                                onChange={(v) => updatePersonal("github", v)}
                                                placeholder="github.com/johndoe"
                                            />
                                        </div>
                                        <Input
                                            label="Portfolio (optional)"
                                            value={p.portfolio}
                                            onChange={(v) => updatePersonal("portfolio", v)}
                                            placeholder="johndoe.dev"
                                        />
                                    </div>
                                )}

                                {/* ── Summary ─────────────────────────── */}
                                {activeTab === "summary" && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Professional Summary
                                        </label>
                                        <textarea
                                            value={resume.summary}
                                            onChange={(e) =>
                                                setResume((prev) => ({
                                                    ...prev,
                                                    summary: e.target.value,
                                                }))
                                            }
                                            rows={5}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                                            placeholder="A results-driven software engineer with 3+ years of experience..."
                                        />
                                    </div>
                                )}

                                {/* ── Experience ──────────────────────── */}
                                {activeTab === "experience" && (
                                    <SectionEditor
                                        type="experience"
                                        items={resume.experience}
                                        onUpdate={updateSection}
                                        onRemove={removeSection}
                                        onAddBullet={addBullet}
                                        onUpdateBullet={updateBullet}
                                        onRemoveBullet={removeBullet}
                                        onAddSection={addSection}
                                    />
                                )}

                                {/* ── Education ───────────────────────── */}
                                {activeTab === "education" && (
                                    <SectionEditor
                                        type="education"
                                        items={resume.education}
                                        isEducation
                                        onUpdate={updateSection}
                                        onRemove={removeSection}
                                        onAddBullet={addBullet}
                                        onUpdateBullet={updateBullet}
                                        onRemoveBullet={removeBullet}
                                        onAddSection={addSection}
                                    />
                                )}

                                {/* ── Skills ──────────────────────────── */}
                                {activeTab === "skills" && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                                                placeholder="Type a skill and press Enter"
                                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                            />
                                            <Button onClick={addSkill} size="sm" variant="outline">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {resume.skills.map((skill) => (
                                                <Badge
                                                    key={skill}
                                                    className="bg-indigo-100 text-indigo-700 cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                                                    onClick={() => removeSkill(skill)}
                                                >
                                                    {skill} ✕
                                                </Badge>
                                            ))}
                                        </div>
                                        {resume.skills.length === 0 && (
                                            <p className="text-xs text-slate-400">
                                                No skills added yet. Type above and press Enter.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── Projects ────────────────────────── */}
                                {activeTab === "projects" && (
                                    <SectionEditor
                                        type="projects"
                                        items={resume.projects}
                                        onUpdate={updateSection}
                                        onRemove={removeSection}
                                        onAddBullet={addBullet}
                                        onUpdateBullet={updateBullet}
                                        onRemoveBullet={removeBullet}
                                        onAddSection={addSection}
                                    />
                                )}

                                {/* ── Certifications ──────────────────── */}
                                {activeTab === "certs" && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                value={certInput}
                                                onChange={(e) => setCertInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && addCert()}
                                                placeholder="AWS Solutions Architect, 2024"
                                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                            />
                                            <Button onClick={addCert} size="sm" variant="outline">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {resume.certifications.map((cert, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center justify-between text-sm text-slate-700 p-2 bg-slate-50 rounded-lg"
                                                >
                                                    <span>📜 {cert}</span>
                                                    <button
                                                        onClick={() => removeCert(i)}
                                                        className="text-red-300 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: Live Preview */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">Live Preview</span>
                            <FileText className="h-3.5 w-3.5 ml-auto" />
                        </div>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="border-b border-slate-100 py-2 px-4">
                                <CardTitle className="text-xs text-slate-400 font-normal">
                                    A4 Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div
                                    ref={previewRef}
                                    className="p-8 min-h-[800px] bg-white"
                                    style={{
                                        fontFamily: "'Inter', system-ui, sans-serif",
                                        fontSize: "12px",
                                        lineHeight: "1.5",
                                        color: "#1e293b",
                                    }}
                                >
                                    {/* Header */}
                                    {p.fullName && (
                                        <h1
                                            style={{
                                                fontSize: "22px",
                                                fontWeight: 700,
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {p.fullName}
                                        </h1>
                                    )}
                                    {(p.email || p.phone || p.location) && (
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#64748b",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {[p.email, p.phone, p.location]
                                                .filter(Boolean)
                                                .join(" • ")}
                                        </div>
                                    )}
                                    {(p.linkedin || p.github || p.portfolio) && (
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#6366f1",
                                                marginBottom: "16px",
                                            }}
                                        >
                                            {[p.linkedin, p.github, p.portfolio]
                                                .filter(Boolean)
                                                .join(" • ")}
                                        </div>
                                    )}

                                    {/* Summary */}
                                    {resume.summary && (
                                        <>
                                            <h2
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "1px",
                                                    color: "#334155",
                                                    borderBottom: "1.5px solid #e2e8f0",
                                                    paddingBottom: "4px",
                                                    margin: "16px 0 8px",
                                                }}
                                            >
                                                Summary
                                            </h2>
                                            <p>{resume.summary}</p>
                                        </>
                                    )}

                                    {/* Experience */}
                                    {resume.experience.length > 0 && resume.experience[0].title && (
                                        <>
                                            <h2
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "1px",
                                                    color: "#334155",
                                                    borderBottom: "1.5px solid #e2e8f0",
                                                    paddingBottom: "4px",
                                                    margin: "16px 0 8px",
                                                }}
                                            >
                                                Experience
                                            </h2>
                                            {resume.experience.map((exp) => (
                                                <div key={exp.id} style={{ marginBottom: "12px" }}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "baseline",
                                                            marginBottom: "2px",
                                                        }}
                                                    >
                                                        <h3 style={{ fontSize: "13px", fontWeight: 600 }}>
                                                            {exp.title}
                                                        </h3>
                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                            {exp.startDate} – {exp.endDate}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            fontSize: "11px",
                                                            color: "#64748b",
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        <span>{exp.company}</span>
                                                        <span>{exp.location}</span>
                                                    </div>
                                                    <ul>
                                                        {exp.bullets.map((b, i) =>
                                                            b ? <li key={i}>{b}</li> : null
                                                        )}
                                                    </ul>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Education */}
                                    {resume.education.length > 0 &&
                                        resume.education[0].institution && (
                                            <>
                                                <h2
                                                    style={{
                                                        fontSize: "13px",
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "1px",
                                                        color: "#334155",
                                                        borderBottom: "1.5px solid #e2e8f0",
                                                        paddingBottom: "4px",
                                                        margin: "16px 0 8px",
                                                    }}
                                                >
                                                    Education
                                                </h2>
                                                {resume.education.map((edu) => (
                                                    <div key={edu.id} style={{ marginBottom: "8px" }}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "baseline",
                                                            }}
                                                        >
                                                            <h3 style={{ fontSize: "13px", fontWeight: 600 }}>
                                                                {edu.institution}
                                                            </h3>
                                                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                                {edu.startDate} – {edu.endDate}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: "12px" }}>
                                                            {edu.degree}
                                                            {edu.gpa && (
                                                                <span style={{ color: "#64748b" }}>
                                                                    {" "}
                                                                    • GPA: {edu.gpa}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                    {/* Skills */}
                                    {resume.skills.length > 0 && (
                                        <>
                                            <h2
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "1px",
                                                    color: "#334155",
                                                    borderBottom: "1.5px solid #e2e8f0",
                                                    paddingBottom: "4px",
                                                    margin: "16px 0 8px",
                                                }}
                                            >
                                                Skills
                                            </h2>
                                            <div className="skills">
                                                {resume.skills.map((skill) => (
                                                    <span key={skill} className="skill">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Projects */}
                                    {resume.projects.length > 0 && resume.projects[0].title && (
                                        <>
                                            <h2
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "1px",
                                                    color: "#334155",
                                                    borderBottom: "1.5px solid #e2e8f0",
                                                    paddingBottom: "4px",
                                                    margin: "16px 0 8px",
                                                }}
                                            >
                                                Projects
                                            </h2>
                                            {resume.projects.map((proj) => (
                                                <div key={proj.id} style={{ marginBottom: "12px" }}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "baseline",
                                                            marginBottom: "2px",
                                                        }}
                                                    >
                                                        <h3 style={{ fontSize: "13px", fontWeight: 600 }}>
                                                            {proj.title}
                                                        </h3>
                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                            {proj.startDate} – {proj.endDate}
                                                        </span>
                                                    </div>
                                                    <ul>
                                                        {proj.bullets.map((b, i) =>
                                                            b ? <li key={i}>{b}</li> : null
                                                        )}
                                                    </ul>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Certifications */}
                                    {resume.certifications.length > 0 && (
                                        <>
                                            <h2
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "1px",
                                                    color: "#334155",
                                                    borderBottom: "1.5px solid #e2e8f0",
                                                    paddingBottom: "4px",
                                                    margin: "16px 0 8px",
                                                }}
                                            >
                                                Certifications
                                            </h2>
                                            <ul>
                                                {resume.certifications.map((cert, i) => (
                                                    <li key={i}>{cert}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
