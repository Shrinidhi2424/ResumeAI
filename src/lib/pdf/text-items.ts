/**
 * Pure conversion from pdf2json output to heatmap text items (no I/O).
 * The pdf2json call itself lives in parser.ts (parseFirstPageTextItems).
 */
import type { TextItem } from "./heatmap";

/**
 * Height given to every text item, in pdf2json page units.
 *
 * pdf2json gives each text item an x, y and width (w) but no height.
 * The heatmap only uses height to size the highlight, so a fixed value
 * of roughly one line of body text is good enough. pdf2json units are
 * much larger than PDF points (a Letter page is only ~38 units wide),
 * so this is a small number.
 */
export const TEXT_ITEM_HEIGHT = 0.8;

/** The subset of pdf2json's output that we read. */
export interface Pdf2JsonData {
    Pages: {
        Width: number;
        Height: number;
        Texts: { x: number; y: number; w: number; R: { T: string }[] }[];
    }[];
}

export interface PageTextItems {
    items: TextItem[];
    pageWidth: number;
    pageHeight: number;
}

/**
 * Turn pdf2json output into positioned text items for page 1.
 * Only page 1 is used: it is what a recruiter sees first, and the
 * heatmap viewer only draws the overlay on page 1.
 */
export function extractFirstPageTextItems(pdfData: Pdf2JsonData): PageTextItems {
    const page = pdfData.Pages?.[0];
    if (!page) {
        return { items: [], pageWidth: 0, pageHeight: 0 };
    }

    const items: TextItem[] = page.Texts.map((t) => ({
        // pdf2json stores text URI-encoded, split into runs (R)
        text: t.R.map((run) => safeDecode(run.T)).join(""),
        x: t.x,
        y: t.y,
        width: t.w,
        height: TEXT_ITEM_HEIGHT,
    })).filter((item) => item.text.trim().length > 0);

    return { items, pageWidth: page.Width, pageHeight: page.Height };
}

/** decodeURIComponent, but keep the raw text if it is malformed. */
function safeDecode(text: string): string {
    try {
        return decodeURIComponent(text);
    } catch {
        return text;
    }
}
