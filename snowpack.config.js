// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */

const proxy = require("http2-proxy");

const root = __dirname;

module.exports = {
  exclude: [
    "**/thinking/**/*",
    "**/.git/**/*",
    "**/package*",
    "**/Designs In Progress/**",
    `${root}/node_modules/**`,
  ],
  mount: {
    /* ... */
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
    hmr: true,
  },
  buildOptions: {
    out: "docs",
    /* ... */
  },
  /*
  optimize: {
    bundle: true,
    minify: true,
    target: "es2018",
  },
  */
  routes: [
    {
      src: "/log",
      dest: (req, res) => {
        return proxy.web(req, res, {
          hostname: "localhost",
          port: 8055,
        });
      },
    },
  ],
};
