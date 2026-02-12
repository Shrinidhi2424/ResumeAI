import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface KeywordBadgesProps {
    matchedKeywords: string[];
    missingKeywords: string[];
}

/**
 * Displays matched keywords (green) and missing keywords (red) as badge groups.
 * Each keyword is individually badged with an icon for quick visual scanning.
 */
export function KeywordBadges({
    matchedKeywords,
    missingKeywords,
}: KeywordBadgesProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Matched Keywords */}
            <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Matched Keywords
                        <Badge
                            variant="secondary"
                            className="ml-auto bg-emerald-100 text-emerald-700 text-xs"
                        >
                            {matchedKeywords.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {matchedKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {matchedKeywords.map((keyword) => (
                                <Badge
                                    key={keyword}
                                    variant="outline"
                                    className="border-emerald-300 bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 transition-colors"
                                >
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">
                            No keyword matches found.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Missing Keywords */}
            <Card className="border-red-200 bg-red-50/50 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-700">
                        <XCircle className="h-4 w-4" />
                        Missing Keywords
                        <Badge
                            variant="secondary"
                            className="ml-auto bg-red-100 text-red-700 text-xs"
                        >
                            {missingKeywords.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {missingKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {missingKeywords.map((keyword) => (
                                <Badge
                                    key={keyword}
                                    variant="outline"
                                    className="border-red-300 bg-red-100 text-red-800 font-medium hover:bg-red-200 transition-colors"
                                >
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">
                            Great! No critical keywords are missing.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
