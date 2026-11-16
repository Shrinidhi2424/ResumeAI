import { describe, it, expect } from "vitest";
import { extractFirstPageTextItems, TEXT_ITEM_HEIGHT, type Pdf2JsonData } from "./text-items";

describe("extractFirstPageTextItems", () => {
    it("decodes URI-encoded text, keeps positions and returns page size", () => {
        const pdfData: Pdf2JsonData = {
            Pages: [
                {
                    Width: 38.25,
                    Height: 49.5,
                    Texts: [
                        { x: 2, y: 3, w: 10, R: [{ T: "Senior%20Engineer" }] },
                        { x: 2, y: 5, w: 8, R: [{ T: "C%2B%2B" }, { T: "%20%26%20Go" }] },
                        { x: 2, y: 7, w: 1, R: [{ T: "%20" }] }, // whitespace only: dropped
                    ],
                },
                { Width: 1, Height: 1, Texts: [{ x: 0, y: 0, w: 1, R: [{ T: "Page2" }] }] },
            ],
        };

        const { items, pageWidth, pageHeight } = extractFirstPageTextItems(pdfData);

        expect(pageWidth).toBe(38.25);
        expect(pageHeight).toBe(49.5);
        expect(items).toEqual([
            { text: "Senior Engineer", x: 2, y: 3, width: 10, height: TEXT_ITEM_HEIGHT },
            { text: "C++ & Go", x: 2, y: 5, width: 8, height: TEXT_ITEM_HEIGHT },
        ]);
    });

    it("keeps malformed URI text as-is instead of throwing", () => {
        const pdfData: Pdf2JsonData = {
            Pages: [{ Width: 10, Height: 10, Texts: [{ x: 0, y: 0, w: 1, R: [{ T: "100%" }] }] }],
        };
        expect(extractFirstPageTextItems(pdfData).items[0].text).toBe("100%");
    });

    it("returns no items and zero size for a PDF with no pages", () => {
        expect(extractFirstPageTextItems({ Pages: [] })).toEqual({
            items: [],
            pageWidth: 0,
            pageHeight: 0,
        });
    });
});
