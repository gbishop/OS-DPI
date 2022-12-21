// vite.config.js
import { defineConfig } from "vite";
import path from "path";

const version = new Date().toJSON().replace(/[:-]/g, "").replace(/\..*$/, "");

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
    minify: true,
    target: "esnext",
    rollupOptions: {
      output: {
        entryFileNames: `[name].${version}.js`,
        chunkFileNames: `[name].${version}.js`,
        assetFileNames: `[name].${version}.[ext]`,
      },
      // plugins: [analyze()],
    },
  },
});
