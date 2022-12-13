import { TreeBase } from "./treebase";
import { Stack } from "./stack";
import { PatternGroup } from "components/access/pattern";

import "css/toolbar.css";
import db from "app/db";
import { html } from "uhtml";
import Globals from "app/globals";
import { Menu, MenuItem } from "./menu";
import { callAfterRender } from "app/render";
import { fileOpen } from "browser-fs-access";
import pleaseWait from "components/wait";
import { DB } from "app/db";
import { DesignerTabControl } from "./tabcontrol";

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
              return component.id;
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
              return component.id;
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

  /** @param {function():string} arg */
  function itemCallback(arg) {
    return () => {
      let nextId = arg();
      console.log({ nextId });
      // we're looking for the settings view but we may have the id of the user view
      if (panel.lastFocused.startsWith(nextId)) {
        console.log("set to lf", panel.lastFocused);
        nextId = panel.lastFocused;
      }
      if (nextId.match(/^TreeBase-\d+$/)) {
        nextId = nextId + "-settings";
        console.log({ nextId });
      }
      console.log("set lastFocused to result", nextId);
      panel.lastFocused = nextId;
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
    !(component instanceof PatternGroup && parent instanceof PatternGroup) &&
    !(parent instanceof DesignerTabControl)
  ) {
    const parentItems = getComponentMenuItems(parent, type, itemCallback);
    if (menuItems.length && parentItems.length) {
      parentItems[0].divider = true;
    }
    menuItems = menuItems.concat(parentItems);
  }

  // console.log(filteredActionsToMenuItems);
  return menuItems;
}

function getFileMenuItems() {
  return [
    new MenuItem("Import", async () => {
      const local_db = new DB();
      fileOpen({
        mimeTypes: ["application/octet-stream"],
        extensions: [".osdpi", ".zip"],
        description: "OS-DPI designs",
        id: "os-dpi",
      })
        .then((file) => pleaseWait(local_db.readDesignFromFile(file)))
        .then(() => {
          window.open(`#${local_db.designName}`, "_blank", "noopener=true");
        });
    }),
    new MenuItem("Export", () => {
      db.saveDesign();
    }),
    new MenuItem("New", async () => {
      const name = await db.uniqueName("new");
      window.open(`#${name}`, "_blank", "noopener=true");
    }),
    new MenuItem("Open", () => {
      window.open("#", "_blank", "noopener=true");
    }),
    new MenuItem("Unload", async () => {
      const saved = await db.saved();
      if (saved.indexOf(db.designName) < 0) {
        try {
          await db.saveDesign();
        } catch (e) {
          if (e instanceof DOMException) {
            console.log("canceled save");
          } else {
            throw e;
          }
        }
      }
      await db.unload(db.designName);
      window.close();
    }),
  ];
}

function getEditMenuItems() {
  const items = [
    new MenuItem("Undo", () => {
      const panel = Globals.designer.currentPanel;
      console.log({ panel });
      Globals.designer.currentPanel.undo();
    }),
    new MenuItem("Copy", async () => {
      const component = Globals.designer.selectedComponent;
      const json = JSON.stringify(component.toObject());
      navigator.clipboard.writeText(json);
    }),
    new MenuItem("Cut", async () => {
      const component = Globals.designer.selectedComponent;
      const json = JSON.stringify(component.toObject());
      await navigator.clipboard.writeText(json);
      component.remove();
      Globals.designer.currentPanel.onUpdate();
    }),
    new MenuItem("Paste", async () => {
      const json = await navigator.clipboard.readText();
      const obj = JSON.parse(json);
      const className = obj.className;
      if (!className) return;
      // find a place that can accept it
      const anchor = Globals.designer.selectedComponent;
      let current = anchor;
      while (current) {
        if (current.allowedChildren.indexOf(className) >= 0) {
          const result = TreeBase.fromObject(obj, current);
          if (
            anchor.parent === result.parent &&
            result.index != anchor.index + 1
          ) {
            anchor.moveTo(anchor.index + 1);
          }
          Globals.designer.currentPanel.onUpdate();
          return;
        }
        current = current.parent;
      }
    }),
    new MenuItem("Paste Into", async () => {
      const json = await navigator.clipboard.readText();
      const obj = JSON.parse(json);
      const className = obj.className;
      if (!className) return;
      // find a place that can accept it
      const current = Globals.designer.selectedComponent;
      if (current.allowedChildren.indexOf(className) >= 0) {
        TreeBase.fromObject(obj, current);
        Globals.designer.currentPanel.onUpdate();
      }
    }),
  ];
  return items.concat(getPanelMenuItems("delete"), getPanelMenuItems("move"));
}

function getTabsMenuItems() {
  /** @param {string} name */
  function activateTab(name) {
    const buttons = /** @type {HTMLButtonElement[]} */ ([
      ...document.querySelectorAll("#designer .tabcontrol .buttons button"),
    ]);
    const target = buttons.find((el) => el.textContent.includes(name));
    console.log({ name, buttons, target });
    target.click();
  }
  return [
    new MenuItem("Layout", activateTab, "Layout"),
    new MenuItem("Actions", activateTab, "Actions"),
    new MenuItem("Cues", activateTab, "Cues"),
    new MenuItem("Patterns", activateTab, "Patterns"),
    new MenuItem("Methods", activateTab, "Methods"),
    new MenuItem("Content", activateTab, "Content"),
    new MenuItem("Logging", activateTab, "Logging"),
  ];
}

/**
 * @param {Hole} thing
 * @param {string} hint
 */
function hinted(thing, hint) {
  return html`<div class="hinted">${thing}<span>${hint}</span></div>`;
}

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");

    this.fileMenu = new Menu("File", getFileMenuItems);
    this.editMenu = new Menu("Edit", getEditMenuItems);
    this.addMenu = new Menu("Add", getPanelMenuItems, "add");
    this.tabsMenu = new Menu("Tabs", getTabsMenuItems);
    this.backButton = html`<button
      onclick=${() => Globals.designer.restoreFocus()}
    >
      Back
    </button>`;
  }

  template() {
    const { state } = Globals;
    return html`
      <div class="toolbar brand">
        <ul>
          <li>
            <label for="designName">Name: </label>
            ${hinted(
              html` <input
                id="designName"
                type="text"
                .value=${db.designName}
                .size=${Math.max(db.designName.length, 12)}
                onchange=${(event) =>
                  db
                    .renameDesign(event.target.value)
                    .then(() => (window.location.hash = db.designName))}
              />`,
              "N"
            )}
          </li>
          <li>
            ${hinted(this.fileMenu.render(), "F")}
          </li>
          <li>
            ${hinted(this.editMenu.render(), "E")}
          </li>
          <li>
            ${hinted(this.addMenu.render(), "A")}
          </li>
          <li>
            ${hinted(this.tabsMenu.render(), "T")}
          </li>
          <li>
            ${hinted(this.backButton, "B")}
          </li>
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
