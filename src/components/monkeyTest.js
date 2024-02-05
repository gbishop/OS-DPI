/** Monkey test to find bugs */

import { TreeBase } from "components/treebase";
import { getEditMenuItems, getPanelMenuItems } from "components/toolbar";
import Globals from "app/globals";
import { MenuItem } from "components/menu";
import * as Props from "./props";

const panelNames = ["Layout", "Actions", "Cues", "Patterns", "Methods"];

/* Don't trigger these menu entries */
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

/** A simple seeded random number generator */
class SeededRandom {
  /** @param {number} seed */
  constructor(seed) {
    /** @type {number} */
    this.seed = seed;
  }

  // splittwist32
  random() {
    this.seed |= 0;
    this.seed = (this.seed + 0x9e3779b9) | 0;
    var t = this.seed ^ (this.seed >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  }

  string() {
    const n = 4 + Math.floor(this.random() * 4);
    return this.random().toString(36).slice(2, n);
  }

  integer() {
    return Math.floor(this.random() * 10).toString();
  }

  float() {
    return (this.random() * 10).toString();
  }

  /** Choose one from an array
   * @template T
   * @param {T[]} items
   * @returns {T}
   */
  choose(items) {
    return items[Math.floor(this.random() * items.length)];
  }
}

const seed = 0; // set non-zero for repeatability
const actualSeed = seed || Date.now() | 0;
const random = new SeededRandom(actualSeed);

let updates = 0; // count the number of changes to the interface

/** Implement the test
 */
function* monkeyTest() {
  console.log("Random seed:", random.seed.toString(16));
  let steps = 100;

  for (let step = 0; step < steps; step++) {
    // choose a panel
    const panelName = random.choose(panelNames);
    Globals.designer.switchTab(panelName);
    yield true;

    // get the panel object
    const panel = Globals.designer.currentPanel;

    if (panel) {
      const components = listChildren(panel);
      const component = random.choose(components);
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
      const menuItem = random.choose(menuItems);
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

if (location.host.match(/^localhost.*$|^bs-local.*$/)) {
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
      callback = () => typeInto(prop, random.string());
    } else if (prop instanceof Props.Integer) {
      callback = () => typeInto(prop, random.integer());
    } else if (prop instanceof Props.Float) {
      callback = () => typeInto(prop, random.float());
    } else if (prop instanceof Props.Select) {
      callback = () => {
        const element = document.getElementById(prop.id);
        if (element instanceof HTMLSelectElement) {
          const options = element.options;
          const option = random.choose([...options]);
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
            const color = random.choose([...list.options]);
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
      callback = () => typeInto(prop, random.choose(["true", "false"]));
    } else if (prop instanceof Props.Expression) {
      callback = () => typeInto(prop, random.choose(["1+1", "2*0"]));
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
