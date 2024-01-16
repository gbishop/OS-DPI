/** Monkey test to find bugs */

import { TreeBase } from "components/treebase";
import { getComponentMenuItems, getEditMenuItems } from "components/toolbar";
import Globals from "app/globals";

const panelNames = ["Layout", "Actions", "Cues", "Patterns", "Methods"];

const MenuItemBlacklist = [
  "Audio",
  "Head Mouse",
  "Logger",
  "Speech",
  "Socket Handler",
  "Copy",
  "Cut",
  "Paste",
  "Paste Into",
];

const random = splitmix32(3);

/** Implement the test
 */
function* monkeyTest() {
  let steps = 500;

  while (steps-- > 0) {
    // console.log(steps);
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
        // focus on it
        panel.lastFocused = component.id;
        Globals.designer.restoreFocus();
        yield true;

        // get menu items
        let menuItems = [
          ...getComponentMenuItems(
            component,
            "all",
            (/** @type {function} */ f) => {
              return () => {
                f();
                panel.update();
              };
            },
          ),
          ...getEditMenuItems(),
        ];
        menuItems = menuItems.filter((item) => {
          return MenuItemBlacklist.indexOf(item.label) < 0;
        });
        // choose one
        const menuItem = choose(menuItems);
        if (menuItem && menuItem.callback) {
          // console.log(menuItem.label, components.indexOf(component), component);
          menuItem.callback();
          yield true;
        }
      }
    }
  }

  // now undo all those changes
  let undos = 0;
  for (const panel of Globals.designer.children) {
    while (panel.changeStack.canUndo) {
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
    }
  }, 20);
}

if (location.host.startsWith("localhost")) {
  document.addEventListener(
    "keydown",
    ({ key, ctrlKey }) => key == "m" && ctrlKey && monkey(),
  );
}

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

/** Choose one from an array
 * @template T
 * @param {T[]} items
 * @returns {T}
 */
function choose(items) {
  return items[Math.floor(random() * items.length)];
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
