import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "js",
    emptyOutDir: false,
    minify: false,
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL("./src/browser/calculator-entry.ts", import.meta.url)),
      name: "FaraidCalculatorRuntime",
      formats: ["iife"],
    },
    rollupOptions: {
      output: { entryFileNames: "calculator.js" },
    },
  },
});
