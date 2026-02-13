// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");

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
 * Parse a PDF buffer and extract clean text content using pdf2json.
 *
 * @param buffer - Raw PDF file as a Buffer
 * @returns Parsed and cleaned text with metadata
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDFResult> {
    return new Promise((resolve, reject) => {
        const parser = new PDFParser(null, 1); // 1 = text only

        parser.on("pdfParser_dataError", (errData: { parserError: Error }) => {
            reject(errData.parserError);
        });

        parser.on("pdfParser_dataReady", (pdfData: any) => {
            // Extract text from pages
            const rawText = parser.getRawTextContent().replace(/\r\n/g, "\n");

            // Metadata is sometimes in pdfData.Meta
            const meta = pdfData.Meta || {};

            const cleanedText = cleanPDFText(rawText);

            resolve({
                text: cleanedText,
                pageCount: pdfData.Pages.length,
                metadata: {
                    title: meta.Title && typeof meta.Title === 'string' ? decodeURIComponent(meta.Title) : undefined,
                    author: meta.Author && typeof meta.Author === 'string' ? decodeURIComponent(meta.Author) : undefined,
                    subject: meta.Subject && typeof meta.Subject === 'string' ? decodeURIComponent(meta.Subject) : undefined,
                },
            });
        });

        // pdf2json expects a buffer, but its main API takes a file path.
        // It has a parseBuffer method.
        parser.parseBuffer(buffer);
    });
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
