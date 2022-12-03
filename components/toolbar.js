import { TreeBase } from "./treebase";
import { Stack } from "./stack";
import { PatternGroup } from "components/access/pattern";

import "css/toolbar.css";
import db from "app/db";
import { html } from "uhtml";
import Globals from "app/globals";
import { Menu, MenuItem } from "./menu";
import { callAfterRender } from "app/render";

const friendlyNamesMap = {
  ActionCondition: "Condition",
  ActionUpdate: "Update",
  TabControl: "Tab Control",
  CueCss: "Cue",
  CueFill: "Cue",
  PatternManager: "Pattern",
  PatternGroup: "Group",
  PatternSelector: "Selector",
  GroupBy: "Group by",
  OrderBy: "Order by",
  TimerHandler: "Timer handler",
  PointerHandler: "Pointer Handler",
  KeyHandler: "Key Handler",
  HandlerCondition: "Condition",
  HandlerResponse: "Response",
  GridFilter: "Filter",
  TabPanel: "Tab Panel",
};

function friendlyName(name) {
  return friendlyNamesMap[name] || name;
}

/** Return a list of available Menu items on this component
 *
 * @param {TreeBase} component
 * @param {"add" | "delete" | "move" | "all"} which - which actions to return
 * @param {function} wrapper
 * @returns {MenuItem[]}
 */
function getComponentMenuItems(component, which = "all", wrapper) {
  /** @type {MenuItem[]} */
  const result = [];
  // add actions
  if (which == "add" || which == "all") {
    for (const className of component.allowedChildren.sort()) {
      result.push(
        new MenuItem(
          `${friendlyName(className)}`,
          wrapper(() => {
            const result = TreeBase.create(className, component);
            return result.id;
          })
        )
      );
    }
  }
  // delete
  if (which == "delete" || which == "all") {
    if (component.allowDelete) {
      result.push(
        new MenuItem(
          `Delete ${friendlyName(component.className)}`,
          wrapper(() => {
            // remove returns the id of the nearest neighbor or the parent
            const nextId = component.remove();
            console.log({ nextId });
            return nextId;
          })
        )
      );
    }
  }

  // move
  if (which == "move" || which == "all") {
    if (component.parent) {
      const index = component.index;

      if (index > 0) {
        // moveup
        result.push(
          new MenuItem(
            `Move up ${friendlyName(component.className)}`,
            wrapper(() => {
              component.parent.swap(index, index - 1);
            })
          )
        );
      }
      if (index < component.parent.children.length - 1) {
        // movedown
        result.push(
          new MenuItem(
            `Move down ${friendlyName(component.className)}`,
            wrapper(() => {
              component.parent.swap(index, index + 1);
            })
          )
        );
      }
    }
  }
  return result;
}

/**
 * Determines valid menu items given a menu type.
 * @param {"add" | "delete" | "move" | "all"} type
 * @return {MenuItem[]}
 * */
function getPanelMenuItems(type) {
  // Figure out which tab is active
  const { designer } = Globals;
  const panel = designer.currentPanel;

  // Ask that tab which component is focused
  if (!panel.lastFocused) {
    console.log("no lastFocused");
    return [];
  }
  const component = TreeBase.componentFromId(panel.lastFocused);
  if (!component) {
    console.log("no component");
    return [];
  }

  /** @param {function} arg */
  function itemCallback(arg) {
    return () => {
      const nextId = arg();
      // we're looking for the settings view but we have the id of the user view
      panel.lastFocused = nextId + "-settings";
      callAfterRender(() => panel.parent.restoreFocus());
      panel.update();
    };
  }

  // Ask that component for its menu actions
  let menuItems = getComponentMenuItems(component, type, itemCallback);

  // Add the parent's actions in some cases
  const parent = component.parent;

  if (
    type !== "move" && // no moves
    parent &&
    !(component instanceof Stack && parent instanceof Stack) &&
    !(component instanceof PatternGroup && parent instanceof PatternGroup)
  ) {
    const parentItems = getComponentMenuItems(parent, type, itemCallback);
    if (menuItems.length && parentItems.length) {
      menuItems.push(new MenuItem("--Parent--", null));
    }
    menuItems = menuItems.concat(
      getComponentMenuItems(parent, type, itemCallback)
    );
  }

  // console.log(filteredActionsToMenuItems);
  return menuItems;
}

function getFileMenuItems() {
  return [
    new MenuItem("Import", null),
    new MenuItem("Export", null),
    new MenuItem("New", null),
    new MenuItem("Open", null),
    new MenuItem("Unload", null),
  ];
}

function getEditMenuItems() {
  const items = [
    new MenuItem("Undo", null),
    new MenuItem("Copy", null),
    new MenuItem("Cut", null),
    new MenuItem("Paste", null),
  ];
  return items.concat(getPanelMenuItems("delete"), getPanelMenuItems("move"));
}

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");

    this.menus = [
      new Menu("File", getFileMenuItems),
      new Menu("Edit", getEditMenuItems),
      new Menu("Add", getPanelMenuItems, "add"),
    ];
  }

  template() {
    const { state } = Globals;
    return html`
      <div class="bar">
        <label for="designName">Name: </label>
        <input
          id="designName"
          type="text"
          .value=${db.designName}
          .size=${Math.max(db.designName.length, 12)}
          onchange=${(event) =>
            db
              .renameDesign(event.target.value)
              .then(() => (window.location.hash = db.designName))}
        />
        <span id="ContextSpecificMenu">
          ${this.menus.map((menu) => menu.render())}
        </span>
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");

/*
        <button onclick=${() => db.saveDesign()}>Export</button>
        <button onclick=${() => window.open("#", "_blank")}>Home</button>
        <button
          onclick=${async () => {
            const tab = state.get("designerTab").toLowerCase();
            if (["layout", "actions"].indexOf(tab) >= 0) {
              await db.undo(tab);
              Globals.restart();
            }
          }}
        >
          Undo
        </button>
*/

export default toolbar;
