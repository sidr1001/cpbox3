import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy API requests to the backend during development
    proxy: mode === "development" ? {
      "/api": {
        // If VITE_API_URL is defined, strip trailing /api to get origin
        target: process.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    } : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
