/** @typedef {Object} GlobalsObject
 * @property {State} state
 * @property {import("./data").Data} data
 * @property {import("./components/actions").Actions} actions
 * @property {TreeBase} tree
 * @property {import('./components/access/pattern').PatternList} patterns
 * @property {import('./components/access/cues').CueList} cues
 * @property {import('./components/access/method').MethodChooser} method
 * @property {import('./components/monitor').Monitor} monitor
 * @property {import('./components/toolbar').ToolBar} toolbar
 * @property {import('./components/designer').Designer} designer
 * @property {import('./components/errors').Messages} error
 * @property {function():Promise<void>} restart
 */

/** @type {GlobalsObject} */
// @ts-ignore Object missing properties
const Globals = {};

export default Globals;
