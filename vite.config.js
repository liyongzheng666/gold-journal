import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Local previews use /. The Pages workflow sets /gold-journal/ for the project site.
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
