"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreCardProps {
    score: number;
    label: string;
    subtitle?: string;
    size?: "sm" | "md" | "lg";
}

/**
 * Radial progress ring showing a score from 0–100.
 * Color transitions from red (0–40) → amber (40–70) → emerald (70–100).
 */
export function ScoreCard({
    score,
    label,
    subtitle,
    size = "md",
}: ScoreCardProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animate score on mount
    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    const dimensions = {
        sm: { svgSize: 100, radius: 38, stroke: 6, fontSize: "text-xl" },
        md: { svgSize: 140, radius: 54, stroke: 8, fontSize: "text-3xl" },
        lg: { svgSize: 180, radius: 70, stroke: 10, fontSize: "text-4xl" },
    };

    const { svgSize, radius, stroke, fontSize } = dimensions[size];
    const circumference = 2 * Math.PI * radius;
    const progress = (animatedScore / 100) * circumference;
    const offset = circumference - progress;

    // Color based on score
    const getColor = (s: number) => {
        if (s >= 70) return { ring: "stroke-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
        if (s >= 40) return { ring: "stroke-amber-500", text: "text-amber-600", bg: "bg-amber-50" };
        return { ring: "stroke-red-500", text: "text-red-600", bg: "bg-red-50" };
    };

    const colors = getColor(animatedScore);

    return (
        <Card className={`${colors.bg} border-0 shadow-sm`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2 pt-0">
                <div className="relative" style={{ width: svgSize, height: svgSize }}>
                    <svg
                        width={svgSize}
                        height={svgSize}
                        viewBox={`0 0 ${svgSize} ${svgSize}`}
                        className="-rotate-90"
                    >
                        {/* Background ring */}
                        <circle
                            cx={svgSize / 2}
                            cy={svgSize / 2}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={stroke}
                            className="text-slate-200"
                        />
                        {/* Progress ring */}
                        <circle
                            cx={svgSize / 2}
                            cy={svgSize / 2}
                            r={radius}
                            fill="none"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={`${colors.ring} transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    {/* Score text in center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`${fontSize} font-bold ${colors.text}`}>
                            {animatedScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                    </div>
                </div>
                {subtitle && (
                    <p className="text-xs text-slate-500 text-center">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}
