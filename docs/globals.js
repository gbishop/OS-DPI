const Globals = {
  /** @type {State} */
  state: null,
  /** @type {import("./data").Data} */
  data: null,
  /** @type {import("./rules").Rules} */
  rules: null,
  /** @type {Tree} */
  tree: null,
  /** @type {import('./components/access/pattern').PatternList} */
  patterns: null,
  /** @type {import('./components/access/method').MethodChooser} */
  method: null,
  /** @type {import('./components/access/cues').CueList} */
  cues: null,
  restart: null,
};

export default Globals;
