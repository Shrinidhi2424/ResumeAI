import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb } from "lucide-react";

interface Improvement {
    section: string;
    currentText?: string;
    suggestedText: string;
    reasoning: string;
}

interface ImprovementListProps {
    improvements: Improvement[];
    redFlags?: string[];
    standoutPoints?: string[];
}

/**
 * Expandable accordion displaying section-by-section improvement suggestions.
 * Each entry shows original text → suggested text with reasoning.
 * Also shows red flags and standout points if available.
 */
export function ImprovementList({
    improvements,
    redFlags = [],
    standoutPoints = [],
}: ImprovementListProps) {
    // Group improvements by section
    const grouped = improvements.reduce(
        (acc, imp) => {
            const section = imp.section || "General";
            if (!acc[section]) acc[section] = [];
            acc[section].push(imp);
            return acc;
        },
        {} as Record<string, Improvement[]>
    );

    const sectionIcons: Record<string, string> = {
        Experience: "💼",
        Skills: "🛠️",
        Education: "🎓",
        Projects: "🚀",
        General: "📋",
    };

    return (
        <div className="space-y-6">
            {/* Improvement Suggestions */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                        <Lightbulb className="h-5 w-5 text-indigo-500" />
                        Improvement Suggestions
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {improvements.length} suggestion{improvements.length !== 1 ? "s" : ""}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {Object.keys(grouped).length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {Object.entries(grouped).map(([section, items]) => (
                                <AccordionItem key={section} value={section} className="border-slate-100">
                                    <AccordionTrigger className="text-sm font-medium text-slate-700 hover:text-indigo-600 hover:no-underline py-3">
                                        <span className="flex items-center gap-2">
                                            <span>{sectionIcons[section] || "📋"}</span>
                                            {section}
                                            <Badge variant="outline" className="ml-2 text-xs font-normal">
                                                {items.length}
                                            </Badge>
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pb-4">
                                        {items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                                            >
                                                {/* Original → Suggested */}
                                                {item.currentText && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1 text-sm text-slate-500 line-through decoration-red-300 bg-red-50 rounded-md p-2.5">
                                                            {item.currentText}
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 text-slate-400 mt-2.5 shrink-0" />
                                                        <div className="flex-1 text-sm text-slate-800 font-medium bg-emerald-50 rounded-md p-2.5 border border-emerald-100">
                                                            {item.suggestedText}
                                                        </div>
                                                    </div>
                                                )}
                                                {!item.currentText && (
                                                    <div className="text-sm text-slate-800 font-medium bg-indigo-50 rounded-md p-2.5 border border-indigo-100">
                                                        {item.suggestedText}
                                                    </div>
                                                )}
                                                {/* Reasoning */}
                                                {item.reasoning && (
                                                    <p className="text-xs text-slate-500 italic pl-1">
                                                        💡 {item.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-sm text-slate-400 italic py-2">
                            No specific improvements suggested. Your resume looks great!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Red Flags & Standout Points side by side */}
            {(redFlags.length > 0 || standoutPoints.length > 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Red Flags */}
                    {redFlags.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                                    ⚠️ Red Flags
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-1.5">
                                    {redFlags.map((flag, i) => (
                                        <li
                                            key={i}
                                            className="text-sm text-amber-800 flex items-start gap-2"
                                        >
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Standout Points */}
                    {standoutPoints.length > 0 && (
                        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                    ⭐ Standout Points
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-1.5">
                                    {standoutPoints.map((point, i) => (
                                        <li
                                            key={i}
                                            className="text-sm text-blue-800 flex items-start gap-2"
                                        >
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
