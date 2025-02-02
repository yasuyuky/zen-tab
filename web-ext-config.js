module.exports = {
  sourceDir: ".",
  artifactsDir: "web-ext-artifacts",
  build: {
    overwriteDest: true,
  },
  run: {
    firefox: "firefox",
    startUrl: ["about:debugging#/runtime/this-firefox"],
    browserConsole: true,
  },
};
