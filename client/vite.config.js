import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // React core libraries
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // React Router
            if (id.includes("react-router")) {
              return "router-vendor";
            }
            // Chakra UI and Emotion
            if (
              id.includes("@chakra-ui") ||
              id.includes("@emotion") ||
              id.includes("emotion")
            ) {
              return "chakra-vendor";
            }
            // Framer Motion
            if (id.includes("framer-motion")) {
              return "framer-vendor";
            }
            // React Icons
            if (id.includes("react-icons")) {
              return "icons-vendor";
            }
            // Other vendor libraries
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
