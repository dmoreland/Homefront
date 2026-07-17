import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://dmoreland.github.io/Homefront/ in production,
// so the build needs the repo name as its base path. Dev/preview stay at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Homefront/" : "/",
  plugins: [react()],
}));
