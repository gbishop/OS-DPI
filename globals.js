const Globals = {
  /** @type {State} */
  state: null,
  /** @type {import("./data").Data} */
  data: null,
  /** @type {import("./rules").Rules} */
  rules: null,
  /** @type {Tree} */
  tree: null,
  /** @type {import('./components/access-pattern2').PatternManager} */
  pattern: null,
  cues: { default: "background-color: yellow" },
  restart: null,
};

export default Globals;
