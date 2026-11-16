import { describe, it, expect } from "vitest";
import { generateHeatmap, type TextItem } from "./heatmap";

const PAGE_W = 38.25;
const PAGE_H = 49.5;

function item(text: string, x: number, y: number): TextItem {
    return { text, x, y, width: 4, height: 0.8 };
}

describe("generateHeatmap", () => {
    it("returns [] for empty input", () => {
        expect(generateHeatmap([], ["react"], PAGE_W, PAGE_H)).toEqual([]);
    });

    it("clamps normalised coordinates to [0, 1]", () => {
        const [point] = generateHeatmap([item("Off page", 100, -5)], [], PAGE_W, PAGE_H);
        expect(point.x).toBe(1);
        expect(point.y).toBe(0);
    });

    it("gives top-left text more weight than bottom-right text", () => {
        const points = generateHeatmap(
            [item("Top left", 1, 1), item("Bottom rt", 35, 45)],
            [],
            PAGE_W,
            PAGE_H
        );
        const topLeft = points.find((p) => p.text === "Top left")!;
        const bottomRight = points.find((p) => p.text === "Bottom rt")!;
        expect(topLeft.intensity).toBeGreaterThan(bottomRight.intensity);
    });

    it("raises intensity when the text contains a matched keyword", () => {
        const docker = item("Docker", 24, 35);
        const [withoutKeyword] = generateHeatmap([docker], [], PAGE_W, PAGE_H);
        const [withKeyword] = generateHeatmap([docker], ["Docker"], PAGE_W, PAGE_H);
        expect(withKeyword.isKeywordMatch).toBe(true);
        expect(withKeyword.intensity).toBeGreaterThan(withoutKeyword.intensity);
        // Worked example: F-pattern 0.3479 + length 0.006 = 0.354; + keyword boost 0.4 = 0.754
        expect(withoutKeyword.intensity).toBe(0.354);
        expect(withKeyword.intensity).toBe(0.754);
    });
});
