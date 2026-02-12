"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { HeatmapPoint } from "@/lib/pdf/heatmap";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface HeatmapViewerProps {
    /** URL of the PDF file (Supabase Storage public URL) */
    fileUrl: string;
    /** Normalized heatmap data points (0.0 – 1.0) */
    heatmapData: HeatmapPoint[];
}

/**
 * Renders a PDF with an interactive heatmap canvas overlay.
 *
 * Architecture:
 *   <div relative>
 *     <Page />           ← react-pdf renders the PDF
 *     <canvas absolute /> ← heat blobs drawn on top
 *   </div>
 *
 * The canvas size always matches the PDF page, so normalized
 * coordinates (0–1) are denormalized to actual pixel positions.
 */
export function HeatmapViewer({ fileUrl, heatmapData }: HeatmapViewerProps) {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const PDF_RENDER_WIDTH = 700;

    // ── PDF Callbacks ──────────────────────────────────────────

    const onDocumentLoadSuccess = useCallback(
        ({ numPages: pages }: { numPages: number }) => {
            setNumPages(pages);
            setLoading(false);
        },
        []
    );

    const onPageRenderSuccess = useCallback(() => {
        // Measure the rendered page dimensions
        const pageElement = containerRef.current?.querySelector(
            ".react-pdf__Page__canvas"
        ) as HTMLCanvasElement | null;

        if (pageElement) {
            setPageSize({
                width: pageElement.clientWidth,
                height: pageElement.clientHeight,
            });
        }
    }, []);

    // ── Draw Heatmap ───────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !showHeatmap || pageSize.width === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Match canvas resolution to page size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = pageSize.width * dpr;
        canvas.height = pageSize.height * dpr;
        canvas.style.width = `${pageSize.width}px`;
        canvas.style.height = `${pageSize.height}px`;
        ctx.scale(dpr, dpr);

        // Clear previous frame
        ctx.clearRect(0, 0, pageSize.width, pageSize.height);

        // Draw each heat blob
        heatmapData.forEach((point) => {
            // Denormalize coordinates
            const drawX = point.x * pageSize.width;
            const drawY = point.y * pageSize.height;

            // Blob radius scales with intensity and page width
            const baseRadius = pageSize.width * 0.04;
            const radius = baseRadius * (0.5 + point.intensity * 0.8);

            // Create radial gradient: Red center → Yellow → Transparent
            const gradient = ctx.createRadialGradient(
                drawX,
                drawY,
                0,
                drawX,
                drawY,
                radius
            );

            // Color based on intensity
            const alpha = point.intensity * 0.55;
            if (point.intensity >= 0.7) {
                // Hot: Red → Orange → Transparent
                gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
                gradient.addColorStop(0.4, `rgba(249, 115, 22, ${alpha * 0.7})`);
                gradient.addColorStop(0.7, `rgba(253, 186, 116, ${alpha * 0.3})`);
                gradient.addColorStop(1, "rgba(253, 186, 116, 0)");
            } else if (point.intensity >= 0.4) {
                // Warm: Orange → Yellow → Transparent
                gradient.addColorStop(0, `rgba(249, 115, 22, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(253, 224, 71, ${alpha * 0.5})`);
                gradient.addColorStop(1, "rgba(253, 224, 71, 0)");
            } else {
                // Cool: Yellow → Transparent
                gradient.addColorStop(0, `rgba(253, 224, 71, ${alpha})`);
                gradient.addColorStop(0.6, `rgba(253, 224, 71, ${alpha * 0.3})`);
                gradient.addColorStop(1, "rgba(253, 224, 71, 0)");
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [heatmapData, showHeatmap, pageSize]);

    // Clear canvas when heatmap is toggled off
    useEffect(() => {
        if (!showHeatmap && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [showHeatmap]);

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                        <Eye className="h-5 w-5 text-indigo-500" />
                        Recruiter Heatmap
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Label
                            htmlFor="heatmap-toggle"
                            className="text-sm text-slate-500 cursor-pointer"
                        >
                            {showHeatmap ? (
                                <span className="flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5" /> Heatmap On
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <EyeOff className="h-3.5 w-3.5" /> Heatmap Off
                                </span>
                            )}
                        </Label>
                        <Switch
                            id="heatmap-toggle"
                            checked={showHeatmap}
                            onCheckedChange={setShowHeatmap}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
                {/* Legend */}
                <div className="flex items-center gap-6 mb-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 opacity-70" />
                        High Attention
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-orange-400 opacity-70" />
                        Medium
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-300 opacity-70" />
                        Low Attention
                    </span>
                </div>

                {/* PDF + Canvas Overlay */}
                <div ref={containerRef} className="relative inline-block">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-lg z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                    )}
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={null}
                        className="rounded-lg overflow-hidden shadow-md border border-slate-200"
                    >
                        <Page
                            pageNumber={currentPage}
                            width={PDF_RENDER_WIDTH}
                            onRenderSuccess={onPageRenderSuccess}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />
                    </Document>

                    {/* Canvas overlay - absolutely positioned on top of PDF */}
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                            width: pageSize.width || PDF_RENDER_WIDTH,
                            height: pageSize.height || 900,
                        }}
                    />
                </div>

                {/* Page Navigation */}
                {numPages > 1 && (
                    <div className="flex items-center gap-4 mt-4">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            Page {currentPage} of {numPages}
                        </span>
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.min(numPages, p + 1))
                            }
                            disabled={currentPage >= numPages}
                            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
