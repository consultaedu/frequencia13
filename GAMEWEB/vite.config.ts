import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Pages serves the application at the origin root, including custom domains.
  base: "/",
  appType: "spa",
  build: { outDir: "dist", sourcemap: false },
});
