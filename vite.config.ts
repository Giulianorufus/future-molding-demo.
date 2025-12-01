// FILE: vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT || 5173);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Split heavy libs into separate chunks for faster loads
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          radix: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],
          three: ["three"],
          three_loaders: [
            "three/examples/jsm/controls/OrbitControls.js",
            "three/examples/jsm/loaders/STLLoader.js",
            "three/examples/jsm/loaders/GLTFLoader.js",
          ],
          occt: ["occt-import-js"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    // Avoid prebundling heavy Three libs to reduce AV false positives
    exclude: ["three", "@react-three/fiber", "@react-three/drei"],
    // Ensure CJS shim is ESM-transformed (fixes default import error)
    include: [
      "use-sync-external-store/shim/with-selector.js",
      "use-sync-external-store/shim/with-selector",
      "zustand",
      "zustand/traditional"
    ],
  },
  server: {
    host: HOST,
    port: PORT,
  },
  preview: {
    host: process.env.PREVIEW_HOST || HOST,
    port: Number(process.env.PREVIEW_PORT || 8080),
  },
});
