import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to replace variables in HTML
    {
      name: "html-transform",
      transformIndexHtml(html) {
        return html.replace(
          /%VITE_WS_HOST%/g,
          process.env.VITE_WS_HOST || "localhost:8090"
        );
      },
    },
  ],
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 1000,
    // Let Vite handle chunking automatically to avoid initialization errors
    // Vite's automatic chunking is smarter and avoids circular dependency issues
  },
  server: {
    port: 3002,
    open: true,
  },
});
