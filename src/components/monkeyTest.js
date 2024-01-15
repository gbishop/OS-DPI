/** Monkey test to find bugs */

import { TreeBase } from "components/treebase";
import { getPanelMenuItems, getComponentMenuItems } from "components/toolbar";
import Globals from "app/globals";
import { callAfterRender } from "app/render";

const panelNames = ["Layout", "Actions", "Cues", "Patterns", "Methods"].slice(
  0,
  1,
);

const MenuItemBlacklist = [
  "Audio",
  "Button",
  "Customize",
  "Display",
  "Head Mouse",
  "Logger",
  "Modal Dialog",
  "Page",
  "Radio",
  "Speech",
  "VSD",
  "Grid",
  "Tab Control",
  "Socket Handler",
  "Copy",
  "Cut",
  "Paste",
  "Paste Into",
  "Undo",
  "Redo",
  "Move up",
  "Move down",
  // "Gap",
];

/** Seeded random number generator
 * @param {number} a
 */
function splitmix32(a) {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    var t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

const random = splitmix32(3);

/** Choose one from an array
 * @template T
 * @param {T[]} items
 * @returns {T}
 */
function choose(items) {
  return items[Math.floor(random() * items.length)];
}

function waitForIdle() {
  requestAnimationFrame(() => {
    setTimeout(() => {}, 30);
  });
}

/** @param {TreeBase} component */
function listChildren(component) {
  /** @type {TreeBase[]} */
  const result = [];
  /** @param {TreeBase} node */
  function walk(node) {
    for (const child of node.children) {
      result.push(child);
      walk(child);
    }
  }
  walk(component);
  return result;
}

/** Implement the test
 */
function* monkeyTest() {
  let steps = 11;

  while (steps-- > 0) {
    console.log(steps);
    // choose a panel
    const panelName = choose(panelNames);
    Globals.designer.switchTab(panelName);
    yield true;

    // get the panel object
    const panel = Globals.designer.currentPanel;
    if (panel) {
      const components = listChildren(panel);
      if (components.length) {
        // choose one
        const component = choose(components);
        // get menu items
        let menuItems = getComponentMenuItems(component, "all", (f) => {
          return () => {
            f();
            panel.update();
          };
        });
        menuItems = menuItems.filter((item) => {
          return MenuItemBlacklist.indexOf(item.label) < 0;
        });
        // choose one
        const menuItem = choose(menuItems);
        if (menuItem.callback) {
          console.log(menuItem.label, components.indexOf(component), component);
          menuItem.callback();
          yield true;
        }
      }
    }
  }

  // console.log(JSON.stringify(Globals.designer.currentPanel.changeStack.stack));

  let undos = 0;
  // now undo all those changes
  for (const panelName of panelNames) {
    console.log("undo", panelName);

    Globals.designer.switchTab(panelName);
    yield true;

    // get the panel object
    const panel = Globals.designer.children[0];
    console.log({ panel });
    console.log(panel.changeStack.canUndo);
    while (panel && panel.changeStack.canUndo) {
      console.log(++undos);
      panel.undo();
      yield true;
    }
  }
  yield false;
}

/** Run the monkey test
 */
export function monkey() {
  // quit in case of error
  document.addEventListener("internalerror", () => test.return());
  // start the generator
  const test = monkeyTest();
  // delay if the render isnt complete but don't require it
  let wait = 0;
  document.addEventListener("rendercomplete", () => (wait = 0));
  const timer = setInterval(() => {
    if (wait <= 0) {
      wait = 5;
      if (!test.next().value) clearTimeout(timer);
    } else {
      wait--;
      console.log(wait);
    }
  }, 200);
}

if (location.host.startsWith("localhost")) {
  document.addEventListener(
    "keydown",
    ({ key, ctrlKey }) => key == "m" && ctrlKey && monkey(),
  );
}
