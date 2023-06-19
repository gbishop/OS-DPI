// vite.config.js
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/OS-DPI/",
  resolve: {
    alias: {
      components: path.resolve("./components"),
      app: path.resolve("."),
      css: path.resolve("./css"),
    },
  },
  build: {
    sourcemap: true,
    minify: false,
    target: "esnext",
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
});
