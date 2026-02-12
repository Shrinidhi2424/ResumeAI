"use client";

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    FileText,
    BarChart3,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface SkillGap {
    keyword: string;
    frequency: number;
}

interface ScoreTrend {
    date: string;
    avg_compatibility: number;
    avg_ats: number;
    total_analyses: number;
}

interface Overview {
    total_users: number;
    total_resumes: number;
    total_analyses: number;
    avg_score: number;
    avg_ats_score: number;
}

interface Department {
    department: string;
    student_count: number;
}

interface ScoreDistribution {
    bucket: string;
    count: number;
}

interface AnalyticsDashboardProps {
    skillGaps: SkillGap[];
    scoreTrends: ScoreTrend[];
    overview: Overview;
    departments: Department[];
    scoreDistribution: ScoreDistribution[];
}

// ── Colors ───────────────────────────────────────────────────

const COLORS = {
    indigo: "#6366f1",
    emerald: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    slate: "#64748b",
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#64748b"];

// ── Dashboard Component ──────────────────────────────────────

export function AnalyticsDashboard({
    skillGaps,
    scoreTrends,
    overview,
    departments,
    scoreDistribution,
}: AnalyticsDashboardProps) {
    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    icon={<Users className="h-5 w-5 text-indigo-500" />}
                    label="Total Students"
                    value={overview.total_users}
                    color="bg-indigo-50"
                />
                <StatCard
                    icon={<FileText className="h-5 w-5 text-blue-500" />}
                    label="Resumes Uploaded"
                    value={overview.total_resumes}
                    color="bg-blue-50"
                />
                <StatCard
                    icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
                    label="Total Analyses"
                    value={overview.total_analyses}
                    color="bg-violet-50"
                />
                <StatCard
                    icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                    label="Avg Compatibility"
                    value={`${overview.avg_score ?? 0}%`}
                    color="bg-emerald-50"
                />
                <StatCard
                    icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
                    label="Avg ATS Score"
                    value={`${overview.avg_ats_score ?? 0}%`}
                    color="bg-amber-50"
                />
            </div>

            {/* Charts Row 1: Score Trends + Score Distribution */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Score Trends (Line Chart) */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Score Trends (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {scoreTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={scoreTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        tickFormatter={(d) =>
                                            new Date(d).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })
                                        }
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "12px",
                                        }}
                                        labelFormatter={(d) =>
                                            new Date(d).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                        }
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="avg_compatibility"
                                        name="Compatibility"
                                        stroke={COLORS.indigo}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avg_ats"
                                        name="ATS Score"
                                        stroke={COLORS.emerald}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState text="No score data in the last 30 days." />
                        )}
                    </CardContent>
                </Card>

                {/* Score Distribution (Pie Chart) */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Score Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {scoreDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={scoreDistribution}
                                        dataKey="count"
                                        nameKey="bucket"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={50}
                                        paddingAngle={3}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={false}
                                    >
                                        {scoreDistribution.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "12px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState text="No score data available." />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Skill Gaps + Department Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Skill Gaps (Bar Chart) */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Most Common Skill Gaps
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {skillGaps.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={skillGaps.slice(0, 10)}
                                    layout="vertical"
                                    margin={{ left: 100 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="keyword"
                                        width={90}
                                        tick={{ fontSize: 11, fill: "#64748b" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar
                                        dataKey="frequency"
                                        name="Times Missing"
                                        fill={COLORS.red}
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState text="No skill gap data yet." />
                        )}
                    </CardContent>
                </Card>

                {/* Department Breakdown */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Students by Department
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {departments.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={departments}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="department"
                                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                                        angle={-30}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar
                                        dataKey="student_count"
                                        name="Students"
                                        fill={COLORS.blue}
                                        radius={[4, 4, 0, 0]}
                                        barSize={30}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState text="No department data yet." />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Skill Gaps Table */}
            {skillGaps.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-800">
                            All Missing Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {skillGaps.map((gap) => (
                                <Badge
                                    key={gap.keyword}
                                    variant="outline"
                                    className="border-red-200 bg-red-50 text-red-700 font-medium"
                                >
                                    {gap.keyword}
                                    <span className="ml-1.5 text-red-400 font-normal">
                                        ×{gap.frequency}
                                    </span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <Card className={`${color} border-0 shadow-sm`}>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/70 p-2.5 shadow-sm">{icon}</div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">{label}</p>
                        <p className="text-xl font-bold text-slate-800">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
            {text}
        </div>
    );
}
