// vite.config.js
import { defineConfig } from "vite";
import { version } from "./package.json";

export default defineConfig({
  build: {
    outDir: "docs",
    rollupOptions: {
      output: {
        entryFileNames: `[name].${version}.js`,
        chunkFileNames: `[name].${version}.js`,
        assetFileNames: `[name].${version}.[ext]`,
      },
    },
  },
});
