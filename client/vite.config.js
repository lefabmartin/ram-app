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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Simplified chunking to avoid initialization errors
          if (id.includes("node_modules")) {
            // Only split React into separate chunk
            // Keep everything else together to avoid dependency issues
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // All other vendors in one chunk to avoid circular dependencies
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 3002,
    open: true,
  },
});
