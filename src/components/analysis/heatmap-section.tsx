"use client";

import dynamic from "next/dynamic";
import type { HeatmapPoint } from "@/lib/pdf/heatmap";

// react-pdf / pdf.js need browser APIs, so load the viewer on the client only.
// (`ssr: false` is only allowed inside a Client Component, hence this wrapper.)
const HeatmapViewer = dynamic(
    () => import("./heatmap-viewer").then((m) => m.HeatmapViewer),
    { ssr: false, loading: () => <p className="text-sm text-slate-500">Loading heatmap…</p> }
);

interface HeatmapSectionProps {
    fileUrl: string;
    heatmapData: HeatmapPoint[];
}

/** Results-page section: caption + PDF with the attention overlay (page 1 only). */
export function HeatmapSection({ fileUrl, heatmapData }: HeatmapSectionProps) {
    return (
        <div>
            <p className="text-sm text-slate-500 mb-3">
                Estimated recruiter attention: F-pattern position + matched keywords
            </p>
            <HeatmapViewer fileUrl={fileUrl} heatmapData={heatmapData} />
        </div>
    );
}
