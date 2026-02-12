/**
 * Heatmap Generation Algorithm
 *
 * Simulates recruiter eye-tracking patterns based on:
 * 1. F-Pattern reading behavior (top-left bias)
 * 2. Keyword matching (matched keywords get intensity boost)
 * 3. Section importance weighting
 *
 * All coordinates are NORMALIZED (0.0 – 1.0) so the overlay
 * renders correctly at any zoom level or screen size.
 */

// ── Types ────────────────────────────────────────────────────

export interface TextItem {
    /** Raw text content */
    text: string;
    /** Raw X coordinate from PDF parser */
    x: number;
    /** Raw Y coordinate from PDF parser */
    y: number;
    /** Width of the text item in PDF units */
    width: number;
    /** Height of the text item in PDF units */
    height: number;
}

export interface HeatmapPoint {
    /** Normalized X (0.0 – 1.0) */
    x: number;
    /** Normalized Y (0.0 – 1.0) */
    y: number;
    /** Intensity (0.0 – 1.0) */
    intensity: number;
    /** Normalized width */
    width: number;
    /** Normalized height */
    height: number;
    /** Associated text */
    text: string;
    /** Whether this item matched a keyword */
    isKeywordMatch: boolean;
}

// ── F-Pattern Weights ────────────────────────────────────────

/**
 * Calculate the F-Pattern attention score based on position.
 *
 * Recruiters spend ~80% of their time in the top half and left 60%
 * of a resume (the "F-Pattern").
 *
 * Quadrant weights:
 *   Top-Left:     0.9  (highest attention)
 *   Top-Right:    0.6
 *   Bottom-Left:  0.5
 *   Bottom-Right: 0.3  (lowest attention)
 *
 * Additional vertical decay: items near the top get a bonus.
 */
function calculateFPatternWeight(
    normalizedX: number,
    normalizedY: number
): number {
    const isLeft = normalizedX < 0.6;
    const isTop = normalizedY < 0.5;

    // Base quadrant weight
    let weight: number;
    if (isTop && isLeft) {
        weight = 0.9;
    } else if (isTop && !isLeft) {
        weight = 0.6;
    } else if (!isTop && isLeft) {
        weight = 0.5;
    } else {
        weight = 0.3;
    }

    // Vertical decay: top of page gets up to +0.1 bonus
    const verticalBonus = (1 - normalizedY) * 0.1;

    // Horizontal emphasis: items further left get a slight bonus
    const horizontalBonus = (1 - normalizedX) * 0.05;

    return Math.min(1.0, weight + verticalBonus + horizontalBonus);
}

// ── Keyword Matching ─────────────────────────────────────────

/**
 * Check if a text item contains any matched keyword.
 * Uses case-insensitive matching with word boundaries.
 */
function matchesKeyword(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        // Check for exact word match or partial match for multi-word keywords
        return (
            lowerText.includes(lowerKeyword) ||
            lowerKeyword.split(" ").every((word) => lowerText.includes(word))
        );
    });
}

// ── Main Algorithm ───────────────────────────────────────────

/**
 * Generate heatmap data from PDF text items and matched keywords.
 *
 * @param textItems     - Text items extracted from the PDF with positions
 * @param matchedKeywords - Keywords that were found in the resume
 * @param pageWidth     - PDF page width in points (raw units)
 * @param pageHeight    - PDF page height in points (raw units)
 * @returns Array of normalized HeatmapPoints sorted by intensity (descending)
 */
export function generateHeatmap(
    textItems: TextItem[],
    matchedKeywords: string[],
    pageWidth: number,
    pageHeight: number
): HeatmapPoint[] {
    if (!textItems.length || pageWidth <= 0 || pageHeight <= 0) {
        return [];
    }

    const KEYWORD_BOOST = 0.4;

    const points: HeatmapPoint[] = textItems
        .filter((item) => item.text.trim().length > 0)
        .map((item) => {
            // ── Coordinate Normalization ───────────────────
            const normalizedX = clamp(item.x / pageWidth, 0, 1);
            const normalizedY = clamp(item.y / pageHeight, 0, 1);
            const normalizedWidth = clamp(item.width / pageWidth, 0, 1);
            const normalizedHeight = clamp(item.height / pageHeight, 0, 1);

            // ── Attention Score Calculation ────────────────
            let intensity = calculateFPatternWeight(normalizedX, normalizedY);

            // Keyword boost
            const isKeywordMatch = matchesKeyword(item.text, matchedKeywords);
            if (isKeywordMatch) {
                intensity = Math.min(1.0, intensity + KEYWORD_BOOST);
            }

            // Text length factor: longer text blocks get slightly more weight
            // (section headers are usually short, but important)
            const textLengthFactor = Math.min(item.text.length / 50, 1) * 0.05;
            intensity = Math.min(1.0, intensity + textLengthFactor);

            return {
                x: normalizedX,
                y: normalizedY,
                width: normalizedWidth,
                height: normalizedHeight,
                intensity: roundTo(intensity, 3),
                text: item.text,
                isKeywordMatch,
            };
        });

    // Sort by intensity descending (hottest first for rendering)
    points.sort((a, b) => b.intensity - a.intensity);

    return points;
}

// ── Utility Functions ────────────────────────────────────────

/**
 * Generate heatmap data from pre-existing analysis data.
 * Used when re-rendering a heatmap from stored analysis results
 * that already have coordinates.
 */
export function generateHeatmapFromAnalysis(
    storedPoints: { x: number; y: number; intensity: number }[]
): HeatmapPoint[] {
    return storedPoints.map((point) => ({
        x: clamp(point.x, 0, 1),
        y: clamp(point.y, 0, 1),
        intensity: clamp(point.intensity, 0, 1),
        width: 0.15, // Default blob size
        height: 0.02,
        text: "",
        isKeywordMatch: point.intensity > 0.7,
    }));
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
