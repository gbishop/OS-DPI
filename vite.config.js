// vite.config.js
import { defineConfig } from "vite";
import { version } from "./package.json";
import path from "path";
import analyze from "rollup-plugin-analyzer";

export default defineConfig({
  resolve: {
    alias: {
      components: path.resolve("./components"),
      app: path.resolve("."),
    },
  },
  build: {
    outDir: "docs",
    sourcemap: true,
    minify: true,
    target: "esnext",
    rollupOptions: {
      output: {
        entryFileNames: `[name].${version}.js`,
        chunkFileNames: `[name].${version}.js`,
        assetFileNames: `[name].${version}.[ext]`,
      },
      plugins: [analyze()],
    },
  },
});
