const Globals = {
  /** @type {State} */
  state: null,
  /** @type {import("./data").Data} */
  data: null,
  /** @type {import("./components/designer-tabs/actions").Actions} */
  actions: null,
  /** @type {TreeBase} */
  tree: null,
  /** @type {import('./components/designer-tabs/access/pattern').PatternList} */
  patterns: null,
  /** @type {import('./components/designer-tabs/access/method').MethodChooser} */
  method: null,
  /** @type {import('./components/designer-tabs/access/cues').CueList} */
  cues: null,
  /** @type {import('./components/monitor').Monitor} */
  monitor: null,
  /** @type {import('./components/toolbar').ToolBar} */
  toolbar: null,
  restart: null,
};

export default Globals;
