import { assemble } from "./components/index";
import Rules from "./rules";
import Data from "./data";
import { State } from "./state";

/** let me wait for the page to load */
const pageLoaded = new Promise((resolve) => {
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    resolve();
  });
});

/** Load data and page then go
 * @param {string} name
 */
export async function start(name) {
  const parts = ["design.json", "rules.json", "data.json"].map(async (file) => {
    const resp = await fetch(`./examples/${name}/${file}`);
    return await resp.json();
  });
  const [design, rules, data, _] = await Promise.all([...parts, pageLoaded]);
  /*
  Object.keys(definitions).forEach((key) =>
    state.define(key, definitions[key])
  );
  */
  const state = new State("PO6");
  const context = {
    data: new Data(data),
    rules: new Rules(rules, state),
    state,
  };
  const root = document.querySelector("#UI");
  const tree = assemble(design, context);
  tree.current = root;
  state.observe(() => tree.render());
  tree.render();
}
