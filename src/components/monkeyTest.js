/** Monkey test to find bugs */

import { TreeBase } from "components/treebase";
import { getEditMenuItems, getPanelMenuItems } from "components/toolbar";
import Globals from "app/globals";
import { MenuItem } from "components/menu";
import * as Props from "./props";

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

const seed = 0; // set non-zero for repeatability
const actualSeed = seed || Date.now() % 10000;
console.log("actualSeed:", actualSeed);
const random = splitmix32(actualSeed);

let updates = 0; // count the number of changes to the interface

/** Implement the test
 */
function* monkeyTest() {
  let steps = 1000;

  for (let step = 0; step < steps; step++) {
    // choose a panel
    const panelName = choose(panelNames);
    Globals.designer.switchTab(panelName);
    yield true;

    // get the panel object
    const panel = Globals.designer.currentPanel;

    if (panel) {
      const components = listChildren(panel);
      const component = choose(components);
      if (component) {
        // focus on it
        panel.lastFocused = component.id;
        Globals.designer.restoreFocus();
      } else {
        panel.lastFocused = "";
      }

      const { child } = getPanelMenuItems("add");

      // get menu items
      let menuItems = [
        ...child,
        ...getEditMenuItems(),
        ...getPropertyEdits(component),
      ];

      menuItems = menuItems.filter((item) => {
        return MenuItemBlacklist.indexOf(item.label) < 0;
      });
      menuItems = menuItems.filter((item) => item.callback && !item.disable);

      console.assert(
        !menuItems.find((item) => item.label == "Page"),
        "Should not add Page",
      );

      // choose one
      const menuItem = choose(menuItems);
      if (menuItem && menuItem.callback) {
        // console.log(menuItem.label, components.indexOf(component), component);
        menuItem.callback();
        updates++;
        yield true;
      }
    }
    // check for overflow
    const UI = document.getElementById("UI");
    let overflow = false; // report only once per occurance
    if (
      UI &&
      (UI.scrollWidth > UI.clientWidth || UI.scrollHeight > UI.clientHeight)
    ) {
      if (!overflow) {
        console.error(
          `UI overflow on step ${step} scroll w=${UI.scrollWidth} h=${UI.scrollHeight} client w=${UI.clientWidth} h=${UI.clientHeight}`,
        );
        overflow = true;
      }
    } else {
      overflow = false;
    }
  }

  // now undo all those changes
  let undos = 0;
  for (const panel of Globals.designer.children) {
    const panelName = panel.name.value;
    if (panelNames.indexOf(panelName) >= 0) {
      Globals.designer.switchTab(panelName);
      yield true;

      while (panel.changeStack.canUndo) {
        undos++;
        panel.undo();
        yield true;
      }
    }
  }
  console.log(
    `Test complete: ${steps} steps ${updates} updates ${undos} undos`,
  );

  yield false;
}

/** Run the monkey test
 */
export function monkey() {
  // quit in case of error
  document.addEventListener("internalerror", () => test.return());
  // start the generator
  const test = monkeyTest();
  // allow stopping the test with a key
  const stopHandler = ({ key, ctrlKey }) =>
    key == "q" && ctrlKey && test.return();
  document.addEventListener("keyup", stopHandler);
  // delay if the render isnt complete but don't require it
  let wait = 0;
  document.addEventListener("rendercomplete", () => (wait = 0));
  const timer = setInterval(() => {
    if (wait <= 0) {
      wait = 5;
      if (!test.next().value) {
        clearTimeout(timer);
        document.removeEventListener("keyup", stopHandler);
      }
    } else {
      wait--;
    }
  }, 20);
}

if (location.host.startsWith("localhost")) {
  document.addEventListener(
    "keyup",
    ({ key, ctrlKey }) => key == "m" && ctrlKey && monkey(),
  );
}

/**
 * Fakeup menu items that diddle the property values
 *
 * @param {TreeBase} component
 * @returns {MenuItem[]}
 */
function getPropertyEdits(component) {
  if (!component) return [];
  const props = component.props;
  /** @type {MenuItem[]} */
  const items = [];

  /** @type {function|undefined} */
  let callback = undefined;
  for (const name in props) {
    const prop = props[name];
    if (prop instanceof Props.String) {
      callback = () => typeInto(prop, randomString());
    } else if (prop instanceof Props.Integer) {
      callback = () => typeInto(prop, randomInteger());
    } else if (prop instanceof Props.Float) {
      callback = () => typeInto(prop, randomFloat());
    } else if (prop instanceof Props.Select) {
      callback = () => {
        const element = document.getElementById(prop.id);
        if (element instanceof HTMLSelectElement) {
          const options = element.options;
          const option = choose([...options]);
          if (option instanceof HTMLOptionElement) {
            element.value = option.value;
            element.dispatchEvent(new Event("change"));
          }
        }
      };
    } else if (prop instanceof Props.Color) {
      callback = () => {
        const element = document.getElementById(prop.id);
        if (element instanceof HTMLInputElement) {
          const list = document.getElementById("ColorNames");
          if (list instanceof HTMLDataListElement) {
            const color = choose([...list.options]);
            if (color instanceof HTMLOptionElement) {
              element.value = color.value;
              element.dispatchEvent(new Event("change"));
            }
          }
        }
      };
    } else if (
      prop instanceof Props.Boolean ||
      prop instanceof Props.OneOfGroup
    ) {
      callback = () => {
        const element = document.getElementById(prop.id);
        if (element instanceof HTMLInputElement && element.type == "checkbox") {
          element.checked = !element.checked;
          element.dispatchEvent(new Event("change"));
        }
      };
    } else if (prop instanceof Props.Conditional) {
      callback = () => typeInto(prop, choose(["true", "false"]));
    } else if (prop instanceof Props.Expression) {
      callback = () => typeInto(prop, choose(["1+1", "2*0"]));
    } else {
      continue;
    }
    const item = new MenuItem({
      label: `Change ${component.className}.${prop.label}`,
      callback,
      disable: !component.allowDelete,
    });
    items.push(item);
  }
  return items;
}

function randomString() {
  const n = 4 + Math.floor(random() * 4);
  return random().toString(36).slice(2, n);
}

function randomInteger() {
  return Math.floor(random() * 10).toString();
}

function randomFloat() {
  return (random() * 10).toString();
}

/**
 * @param {Props.Prop} prop
 * @param {string} value
 */
function typeInto(prop, value) {
  const input = document.getElementById(prop.id);
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event("change"));
  }
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
