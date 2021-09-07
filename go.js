import { loadData } from "./data";
import * as rules from "./rules";
import { state } from "./state";
import "./components";

/** let me wait for the page to load */
const pageLoaded = new Promise((resolve) => {
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    resolve();
  });
});

/** Load data and page then go
 * @param {string} name
 * @param {rules.Rules} myRules
 * @param {Object} definitions
 */
export default async function go(name, myRules, definitions = {}) {
  await Promise.all([pageLoaded, loadData(name)]);
  Object.keys(definitions).forEach((key) =>
    state.define(key, definitions[key])
  );
  rules.set(myRules);
  state.render();
}
