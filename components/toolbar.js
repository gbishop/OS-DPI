// import { TreeBase } from "./treebase";
import "css/toolbar.css";
import db from "app/db";
// import { html } from "uhtml";
import Globals from "app/globals";
import { render, html } from "uhtml";
import { Menu, MenuItem } from "./menu";
import { TabPanel } from "./tabcontrol";
import {
  TreeBase,
  MenuActionAdd,
  MenuActionDelete,
  MenuActionMove,
} from "./treebase";
import { callAfterRender } from "app/render";

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");

    this.menu = new Menu("Add", getMenuItems, "add");
    this.menu2 = new Menu("Delete", getMenuItems, "delete");
    this.menu3 = new Menu("Move", getMenuItems, "move");
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
        <span id="ContextSpecificMenu">
          ${this.menu.render()} ${this.menu2.render()} ${this.menu3.render()}
        </span>
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");

export default toolbar;

/**
 * Determines valid menu items given a menu type.
 * @param {"add" | "delete" | "move" | "all"} type 
 * @return {MenuItem[]}
 * */
export function getMenuItems(type) {
  const { state } = Globals;

  // Figure out which tab is active
  const activeTab = state.get("designerTab");
  console.log(activeTab);
  // how to get panel from active tab?
  const panel = null;

  // Ask that tab which component is focused
  if (!panel.lastFocused) {
    console.log("no lastFocused");
    return;
  }
  const component = TreeBase.componentFromId(panel.lastFocused);
  if (!component) {
    console.log("no component");
    return;
  }

  // Ask that component for the list of menu items for "type"
  const filteredActions = component.getMenuActions(type);
  const where = document.getElementById("ContextSpecificMenu");
  let filteredActionsToMenuItems = filteredActions.map((action) => {
    return new MenuItem((action instanceof MenuActionMove ? ((action.step < 0) ? "Up" : "Down") : `${action.className}`), () => {
      render(where, html`<!--empty-->`);
      const nextId = action.apply();
      console.log({ nextId, panel });
      // we're looking for the settings view but we have the id of the user view
      panel.lastFocused = nextId + "-settings";
      callAfterRender(() => panel.parent.restoreFocus());
      panel.update();
    });
  });

  return filteredActionsToMenuItems;
}

/**
 * A hack to test the MenuActions
 * @param {TabPanel} panel */
export function updateMenuActions(panel) {
  console.log({ panel });
  if (!panel.lastFocused) {
    console.log("no lastFocused");
    return;
  }
  const component = TreeBase.componentFromId(panel.lastFocused);
  if (!component) {
    console.log("no component");
    return;
  }
  const actions = component.getMenuActions();

  const where = document.getElementById("ContextSpecificMenu");

  // ${this.menu.render()} ${this.menu2.render()}
  let menuLabels = ["add", "delete", "move"];
  const menus = menuLabels.map((menuLabel) => {
    let filteredActions = actions.filter(function (action) {
      if (menuLabel === "add") {
        return action instanceof MenuActionAdd;
      } else if (menuLabel === "delete") {
        return action instanceof MenuActionDelete;
      } else if (menuLabel === "move") {
        return action instanceof MenuActionMove;
      }
    })

    let filteredActionsToMenuItems = filteredActions.map((action) => {
      return new MenuItem((action instanceof MenuActionMove ? ((action.step < 0) ? "Up" : "Down") : `${action.className}`), () => {
        render(where, html`<!--empty-->`);
        const nextId = action.apply();
        console.log({ nextId, panel });
        // we're looking for the settings view but we have the id of the user view
        panel.lastFocused = nextId + "-settings";
        callAfterRender(() => panel.parent.restoreFocus());
        panel.update();
      });
    });

    // return new Menu(menuLabel, () => filteredActionsToMenuItems);

    // callback asks for current tab -> actions -> menuitems to menu
    // only calculate actions when need
    // note on focus: toggle; go to last place focused
    // way to tab to menu bar
    // no tab traps
    // toolbar on right
    // aria-labeled for buttons...
  });

  menus.forEach((menu) => {
    console.log(menu);
    // document.getElementById('content').appendChild(html`${menu}`);
  })

  render(where, html`${menus}`);
}