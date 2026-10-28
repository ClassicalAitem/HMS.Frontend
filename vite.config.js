import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom", "react-redux"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom"),
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "react-redux",
      "@reduxjs/toolkit",
    ],
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("apexcharts")) {
              return "vendor-charts";
            }
            if (id.includes("slate") || id.includes("mammoth")) {
              return "vendor-editor";
            }
            if (id.includes("react-icons")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
  },
});	