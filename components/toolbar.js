import { TreeBase } from "./treebase";
import { Stack } from "./stack";
import { PatternGroup } from "components/access/pattern";
import { Page } from "components/page";

import "css/toolbar.css";
import db from "app/db";
import { html } from "uhtml";
import Globals from "app/globals";
import { Menu, MenuItem } from "./menu";
import { callAfterRender } from "app/render";
import { fileOpen } from "browser-fs-access";
import pleaseWait from "components/wait";
import { DB } from "app/db";
import { Designer } from "./designer";
import { readSheetFromBlob, saveContent } from "./content";
import { Data } from "app/data";
import { SaveLogs, ClearLogs } from "./logger";

const friendlyNamesMap = {
  ActionCondition: "Condition",
  ActionUpdate: "Update",
  TabControl: "Tab Control",
  Cue: "No Cue",
  CueCss: "Cue CSS",
  CueFill: "Cue Fill",
  CueCircle: "Cue Circle",
  CueOverlay: "Cue Overlay",
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

  /** Get a name for the menu
   * @param {string} name
   * @returns {string}
   */
  function friendlyName(name) {
    return friendlyNamesMap[name] || name;
  }

  // add actions
  if (which == "add" || which == "all") {
    for (const className of component.allowedChildren.sort()) {
      result.push(
        new MenuItem({
          label: `${friendlyName(className)}`,
          callback: wrapper(() => {
            const result = TreeBase.create(className, component);
            result.init();
            return result.id;
          }),
        })
      );
    }
  }
  // delete
  if (which == "delete" || which == "all") {
    if (component.allowDelete) {
      result.push(
        new MenuItem({
          label: `Delete`,
          title: `Delete ${friendlyName(component.className)}`,
          callback: wrapper(() => {
            // remove returns the id of the nearest neighbor or the parent
            const nextId = component.remove();
            return nextId;
          }),
        })
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
          new MenuItem({
            label: `Move up`,
            title: `Move up ${friendlyName(component.className)}`,
            callback: wrapper(() => {
              component.parent.swap(index, index - 1);
              return component.id;
            }),
          })
        );
      }
      if (index < component.parent.children.length - 1) {
        // movedown
        result.push(
          new MenuItem({
            label: `Move down`,
            title: `Move down ${friendlyName(component.className)}`,
            callback: wrapper(() => {
              component.parent.swap(index, index + 1);
              return component.id;
            }),
          })
        );
      }
    }
  }
  return result;
}

/**
 * Determines valid menu items given a menu type.
 * @param {"add" | "delete" | "move" | "all"} type
 * @return {{ child: MenuItem[], parent: MenuItem[]}}
 * */
function getPanelMenuItems(type) {
  // Figure out which tab is active
  const { designer } = Globals;
  const panel = designer.currentPanel;

  // Ask that tab which component is focused
  if (!panel.lastFocused) {
    return { child: [], parent: [] };
  }
  const component = TreeBase.componentFromId(panel.lastFocused);
  if (!component) {
    return { child: [], parent: [] };
  }

  /** @param {function():string} arg */
  function itemCallback(arg) {
    return () => {
      let nextId = arg();
      // we're looking for the settings view but we may have the id of the user view
      if (panel.lastFocused.startsWith(nextId)) {
        nextId = panel.lastFocused;
      }
      if (nextId.match(/^TreeBase-\d+$/)) {
        nextId = nextId + "-settings";
      }
      panel.lastFocused = nextId;
      callAfterRender(() => panel.parent.restoreFocus());
      panel.update();
    };
  }

  // Ask that component for its menu actions
  let menuItems = getComponentMenuItems(component, type, itemCallback);

  // Add the parent's actions in some cases
  const parent = component.parent;

  let parentItems = [];
  if (
    type === "add" &&
    parent &&
    !(component instanceof Stack && parent instanceof Stack) &&
    !(component instanceof PatternGroup && parent instanceof PatternGroup) &&
    !(parent instanceof Designer)
  ) {
    parentItems = getComponentMenuItems(parent, type, itemCallback);
    // if (menuItems.length && parentItems.length) {
    //   parentItems[0].divider = "Parent";
    // }
    // menuItems = menuItems.concat(parentItems);
  }

  return { child: menuItems, parent: parentItems };
}

function getFileMenuItems() {
  return [
    new MenuItem({
      label: "Import",
      callback: async () => {
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
      },
    }),
    new MenuItem({
      label: "Export",
      callback: () => {
        db.saveDesign();
      },
    }),
    new MenuItem({
      label: "New",
      callback: async () => {
        const name = await db.uniqueName("new");
        window.open(`#${name}`, "_blank", "noopener=true");
      },
    }),
    new MenuItem({
      label: "Open",
      callback: () => {
        window.open("#", "_blank", "noopener=true");
      },
    }),
    new MenuItem({
      label: "Unload",
      callback: async () => {
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
      },
    }),
    new MenuItem({
      label: "Load Sheet",
      title: "Load a spreadsheet of content",
      divider: "Content",
      callback: async () => {
        try {
          const blob = await fileOpen({
            extensions: [".csv", ".tsv", ".ods", ".xls", ".xlsx"],
            description: "Spreadsheets",
            id: "os-dpi",
          });
          if (blob) {
            sheet.handle = blob.handle;
            const result = await pleaseWait(readSheetFromBlob(blob));
            await db.write("content", result);
            Globals.data = new Data(result);
            Globals.state.update();
          }
        } catch (e) {
          sheet.handle = null;
          console.log("cleared sheet.handle");
        }
      },
    }),
    new MenuItem({
      label: "Reload sheet",
      title: "Reload a spreadsheet of content",
      callback:
        sheet.handle && // only offer reload if we have the handle
        (async () => {
          let blob;
          blob = await sheet.handle.getFile();
          if (blob) {
            const result = await pleaseWait(readSheetFromBlob(blob));
            await db.write("content", result);
            Globals.data = new Data(result);
            Globals.state.update();
          } else {
            console.log("no file to reload");
          }
        }),
    }),
    new MenuItem({
      label: "Save sheet",
      title: "Save the content as a spreadsheet",
      callback: () => {
        saveContent(db.designName, Globals.data.allrows, "xlsx");
      },
    }),
    new MenuItem({
      label: "Load media",
      title: "Load audio or images into the design",
      callback: async () => {
        try {
          const files = await fileOpen({
            description: "Media files",
            mimeTypes: ["image/*", "audio/*"],
            multiple: true,
          });
          for (const file of files) {
            await db.addMedia(file, file.name);
            if (file.type.startsWith("image/")) {
              for (const img of document.querySelectorAll(
                `img[dbsrc="${file.name}"]`
              )) {
                /** @type {ImgDb} */ (img).refresh();
              }
            }
          }
        } catch {}
        Globals.state.update();
      },
    }),
    new MenuItem({
      label: "Save logs",
      title: "Save any logs as spreadsheets",
      divider: "Logs",
      callback: async () => {
        SaveLogs();
      },
    }),
    new MenuItem({
      label: "Clear logs",
      title: "Clear any stored logs",
      callback: async () => {
        ClearLogs();
      },
    }),
  ];
}

function getEditMenuItems() {
  let items = [
    new MenuItem({
      label: "Undo",
      callback: () => {
        Globals.designer.currentPanel.undo();
      },
    }),
    new MenuItem({
      label: "Copy",
      callback: async () => {
        const component = Globals.designer.selectedComponent;
        if (component) {
          const parent = component.parent;
          if (!(component instanceof Page) && !(parent instanceof Designer)) {
            const json = JSON.stringify(component.toObject());
            navigator.clipboard.writeText(json);
          }
        }
      },
    }),
    new MenuItem({
      label: "Cut",
      callback: async () => {
        const component = Globals.designer.selectedComponent;
        const json = JSON.stringify(component.toObject());
        await navigator.clipboard.writeText(json);
        component.remove();
        Globals.designer.currentPanel.onUpdate();
      },
    }),
    new MenuItem({
      label: "Paste",
      callback: async () => {
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
      },
    }),
    new MenuItem({
      label: "Paste Into",
      callback: async () => {
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
      },
    }),
  ];
  const deleteItems = getPanelMenuItems("delete");
  const moveItems = getPanelMenuItems("move");
  items = items.concat(moveItems.child, deleteItems.child);
  const parentItems = moveItems.parent.concat(deleteItems.parent);
  if (parentItems.length > 0) {
    parentItems[0].divider = "Parent";
    items = items.concat(parentItems);
  }
  return items;
}

/**
 * @param {Hole} thing
 * @param {string} hint
 */
function hinted(thing, hint) {
  return html`<div hint=${hint}>${thing}</div>`;
}

const sheet = {
  handle: null,
};

export class ToolBar extends TreeBase {
  init() {
    this.fileMenu = new Menu("File", getFileMenuItems);
    this.editMenu = new Menu("Edit", getEditMenuItems);
    this.addMenu = new Menu(
      "Add",
      () => {
        const { child, parent } = getPanelMenuItems("add");
        if (parent.length > 0) {
          parent[0].divider = "Parent";
        }
        return child.concat(parent);
      },
      "add"
    );
  }

  template() {
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
                onchange=${(/** @type {InputEventWithTarget} */ event) =>
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
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");
