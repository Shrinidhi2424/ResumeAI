"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable, // Added
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities"; // Added

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Building2,
    Briefcase,
    GripVertical,
    Trash2,
    Loader2,
    ArrowLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type AppStatus =
    | "wishlist"
    | "applied"
    | "online_test"
    | "interview"
    | "offer"
    | "rejected";

interface Application {
    id: string;
    companyName: string;
    jobTitle: string;
    status: AppStatus;
    appliedDate: string | null;
    notes: string | null;
    createdAt: string;
}

// ── Column Config ────────────────────────────────────────────

const COLUMNS: {
    id: AppStatus;
    title: string;
    emoji: string;
    color: string;
    borderColor: string;
}[] = [
        {
            id: "wishlist",
            title: "Wishlist",
            emoji: "⭐",
            color: "bg-slate-50",
            borderColor: "border-slate-200",
        },
        {
            id: "applied",
            title: "Applied",
            emoji: "📤",
            color: "bg-blue-50",
            borderColor: "border-blue-200",
        },
        {
            id: "online_test",
            title: "Online Test",
            emoji: "📝",
            color: "bg-violet-50",
            borderColor: "border-violet-200",
        },
        {
            id: "interview",
            title: "Interview",
            emoji: "🎤",
            color: "bg-amber-50",
            borderColor: "border-amber-200",
        },
        {
            id: "offer",
            title: "Offer",
            emoji: "🎉",
            color: "bg-emerald-50",
            borderColor: "border-emerald-200",
        },
        {
            id: "rejected",
            title: "Rejected",
            emoji: "❌",
            color: "bg-red-50",
            borderColor: "border-red-200",
        },
    ];

// ── Droppable Column ─────────────────────────────────────────

function KanbanColumn({
    column,
    apps,
    onDelete,
}: {
    column: (typeof COLUMNS)[number];
    apps: Application[];
    onDelete: (id: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className={`
        flex flex-col rounded-xl border ${column.borderColor} ${column.color}
        min-h-[400px] transition-all duration-200
        ${isOver ? "ring-2 ring-indigo-400 ring-offset-2 scale-[1.01]" : ""}
      `}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{column.emoji}</span>
                    <h3 className="text-sm font-semibold text-slate-700">
                        {column.title}
                    </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {apps.length}
                </Badge>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                {apps.map((app) => (
                    <ApplicationCard key={app.id} app={app} onDelete={onDelete} />
                ))}
                {apps.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Draggable Application Card ───────────────────────────────

function ApplicationCard({
    app,
    onDelete,
    isDragOverlay = false,
}: {
    app: Application;
    onDelete: (id: string) => void;
    isDragOverlay?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: app.id,
            disabled: isDragOverlay,
        });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                className={`
            border-slate-200 bg-white shadow-sm cursor-grab active:cursor-grabbing
            hover:shadow-md transition-all group
            ${isDragOverlay ? "shadow-xl rotate-2 scale-105 cursor-grabbing" : ""}
          `}
                data-drag-id={app.id}
            >
                <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                    {app.companyName}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="text-[11px] text-slate-500 truncate">
                                    {app.jobTitle}
                                </span>
                            </div>
                            {app.appliedDate && (
                                <p className="text-[10px] text-slate-400 mt-1.5">
                                    Applied: {new Date(app.appliedDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                // Important: stop propagation so drag isn't triggered
                                // requires pointer-events-auto on button if parent suppresses
                                e.stopPropagation();
                                onDelete(app.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Add Application Modal ────────────────────────────────────

function AddApplicationForm({
    onAdd,
    onCancel,
}: {
    onAdd: (data: { companyName: string; jobTitle: string }) => void;
    onCancel: () => void;
}) {
    const [companyName, setCompanyName] = useState("");
    const [jobTitle, setJobTitle] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyName.trim() && jobTitle.trim()) {
            onAdd({ companyName: companyName.trim(), jobTitle: jobTitle.trim() });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded-xl border border-slate-200 shadow-lg">
            <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
            />
            <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job title"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">
                    Add
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
            </div>
        </form>
    );
}

// ── Main Kanban Page ─────────────────────────────────────────

export default function TrackerPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeApp, setActiveApp] = useState<Application | null>(null);

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // ── Fetch Applications ─────────────────────────────────────

    useEffect(() => {
        async function fetchApps() {
            try {
                const res = await fetch("/api/applications");
                if (res.ok) {
                    const data = await res.json();
                    setApps(data.applications || []);
                }
            } catch {
                console.error("Failed to fetch applications");
            } finally {
                setLoading(false);
            }
        }
        fetchApps();
    }, []);

    // ── Drag Handlers ──────────────────────────────────────────

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const app = apps.find((a) => a.id === event.active.id);
            if (app) setActiveApp(app);
        },
        [apps]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setActiveApp(null);
            const { active, over } = event;

            if (!over) return;

            const appId = active.id as string;
            const newStatus = over.id as AppStatus;

            // Find the app
            const app = apps.find((a) => a.id === appId);
            if (!app || app.status === newStatus) return;

            // ── OPTIMISTIC UPDATE: Update local state immediately ──
            setApps((prev) =>
                prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
            );

            // ── Background API call ────────────────────────────────
            fetch("/api/applications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: appId, status: newStatus }),
            }).catch(() => {
                // Revert on failure
                setApps((prev) =>
                    prev.map((a) =>
                        a.id === appId ? { ...a, status: app.status } : a
                    )
                );
            });
        },
        [apps]
    );

    // ── Add Application ────────────────────────────────────────

    const handleAdd = async (data: {
        companyName: string;
        jobTitle: string;
    }) => {
        setShowAddForm(false);

        // Optimistic: add a temp card
        const tempId = `temp-${Date.now()}`;
        const tempApp: Application = {
            id: tempId,
            companyName: data.companyName,
            jobTitle: data.jobTitle,
            status: "wishlist",
            appliedDate: null,
            notes: null,
            createdAt: new Date().toISOString(),
        };
        setApps((prev) => [...prev, tempApp]);

        try {
            const res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const { application } = await res.json();
                // Replace temp with real
                setApps((prev) =>
                    prev.map((a) => (a.id === tempId ? application : a))
                );
            }
        } catch {
            // Remove temp on failure
            setApps((prev) => prev.filter((a) => a.id !== tempId));
        }
    };

    // ── Delete Application ─────────────────────────────────────

    const handleDelete = async (id: string) => {
        const prev = apps;
        setApps((a) => a.filter((app) => app.id !== id)); // Optimistic

        try {
            await fetch("/api/applications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch {
            setApps(prev); // Revert
        }
    };

    // ── Render ─────────────────────────────────────────────────

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
                            Application Tracker
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Drag and drop to update your application status
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Application
                    </Button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="mb-6 max-w-sm">
                        <AddApplicationForm
                            onAdd={handleAdd}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </div>
                )}

                {/* Kanban Board */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {COLUMNS.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                apps={apps.filter((a) => a.status === column.id)}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Drag Overlay — renders the dragged card globally */}
                    <DragOverlay>
                        {activeApp ? (
                            <ApplicationCard
                                app={activeApp}
                                onDelete={() => { }}
                                isDragOverlay
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Stats */}
                <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                    <span>
                        Total: <strong className="text-slate-700">{apps.length}</strong>
                    </span>
                    {COLUMNS.map((col) => {
                        const count = apps.filter((a) => a.status === col.id).length;
                        if (count === 0) return null;
                        return (
                            <span key={col.id}>
                                {col.emoji} {count}
                            </span>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
