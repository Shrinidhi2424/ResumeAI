import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * CORS: Allow requests from the Chrome extension.
   *
   * Replace YOUR_EXTENSION_ID with the actual extension ID after loading
   * the unpacked extension in chrome://extensions.
   *
   * During development, we also allow any chrome-extension:// origin.
   */
  async headers() {
    return [
      {
        // Apply CORS to all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // In production, replace with: chrome-extension://YOUR_EXTENSION_ID
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
