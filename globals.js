const Globals = {
  /** @type {State} */
  state: null,
  /** @type {import("./data").Data} */
  data: null,
  /** @type {import("./components/actions").Actions} */
  actions: null,
  /** @type {TreeBase} */
  tree: null,
  /** @type {import('./components/access/pattern').PatternList} */
  patterns: null,
  /** @type {import('./components/access/method').MethodChooser} */
  method: null,
  /** @type {import('./components/access/cues').CueList} */
  cues: null,
  /** @type {import('./components/monitor').Monitor} */
  monitor: null,
  /** @type {import('./components/toolbar').ToolBar} */
  toolbar: null,
  /** @type {import('./components/designer').Designer} */
  designer: null,

  restart: null,
};

export default Globals;
