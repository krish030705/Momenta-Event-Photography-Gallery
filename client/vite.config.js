import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // TEMP: enables readable stack traces to diagnose a production
    // error. Remove this before final deployment -- sourcemaps expose
    // your original source code to anyone in DevTools.
    sourcemap: true,
  },
});