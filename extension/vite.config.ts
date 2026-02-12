import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Vite config for Chrome Extension (Manifest V3).
 *
 * Builds:
 *   - popup.html  → Popup UI (React app)
 *   - content.js  → LinkedIn content script
 *   - background.js → Service worker
 */
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "popup.html"),
                content: resolve(__dirname, "src/content/linkedin-scraper.ts"),
                background: resolve(__dirname, "src/background/service-worker.ts"),
            },
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash].[ext]",
            },
        },
    },
});
