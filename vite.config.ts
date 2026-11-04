import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { redact } from "@tanstack/redact/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    // TanStack Redact statt React im Browser: gleiche API, kleineres Bundle. Der Code importiert
    // weiter aus „react“, das Plugin leitet beim Bauen um. Rendert synchron, ohne Time-Slicing;
    // die App nutzt weder useTransition noch useDeferredValue
    redact(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
