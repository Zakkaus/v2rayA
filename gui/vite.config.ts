import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import path from "path";
import lucideSubset from "./build/lucide-subset.mjs";

export default defineConfig(({ mode }) => ({
  // vuetify(): per-component style and component imports; nothing of the
  // library ends up in the bundle that a template does not use.
  plugins: [lucideSubset(), vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
  },
  server: {
    port: 8081,
  },
  build: {
    outDir: process.env.OUTPUT_DIR || "../web",
    sourcemap: false,
    assetsDir: "static",
    emptyOutDir: true,
  },
  base: process.env.publicPath || (mode === "production" ? "./" : "/"),
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
}));
