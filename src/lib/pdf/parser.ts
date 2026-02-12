// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

/**
 * Result from parsing a PDF file.
 */
export interface ParsedPDFResult {
    /** Cleaned plain-text content extracted from the PDF */
    text: string;
    /** Number of pages in the document */
    pageCount: number;
    /** PDF metadata (title, author, etc.) */
    metadata: {
        title?: string;
        author?: string;
        subject?: string;
    };
}

/**
 * Parse a PDF buffer and extract clean text content.
 *
 * Cleaning steps:
 * 1. Collapse multiple consecutive newlines into a single newline
 * 2. Remove non-printable / control characters (except newlines and tabs)
 * 3. Trim leading/trailing whitespace from each line
 * 4. Remove completely empty lines that add no value
 * 5. Normalize Unicode whitespace (non-breaking spaces, etc.)
 *
 * @param buffer - Raw PDF file as a Buffer
 * @returns Parsed and cleaned text with metadata
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDFResult> {
    const data = await pdfParse(buffer);

    const cleanedText = cleanPDFText(data.text);

    return {
        text: cleanedText,
        pageCount: data.numpages,
        metadata: {
            title: data.info?.Title || undefined,
            author: data.info?.Author || undefined,
            subject: data.info?.Subject || undefined,
        },
    };
}

/**
 * Clean raw text extracted from a PDF.
 * Removes artifacts that commonly confuse AI models.
 */
function cleanPDFText(rawText: string): string {
    let text = rawText;

    // 1. Normalize Unicode whitespace (non-breaking spaces, zero-width chars)
    text = text.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ");

    // 2. Remove non-printable control characters (keep \n, \r, \t)
    text = text.replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F]/g, "");

    // 3. Replace Windows-style line endings
    text = text.replace(/\r\n/g, "\n");
    text = text.replace(/\r/g, "\n");

    // 4. Trim trailing whitespace on each line
    text = text
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");

    // 5. Collapse 3+ consecutive newlines into 2 (preserve paragraph breaks)
    text = text.replace(/\n{3,}/g, "\n\n");

    // 6. Collapse multiple spaces into single space
    text = text.replace(/ {2,}/g, " ");

    // 7. Remove lines that are only whitespace
    text = text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .join("\n");

    // 8. Final trim
    text = text.trim();

    return text;
}
