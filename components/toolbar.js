import { TreeBase, MenuActionMove } from "./treebase";
import "css/toolbar.css";
import db from "app/db";
import { html } from "uhtml";
import Globals from "app/globals";
import { Menu, MenuItem } from "./menu";
import { callAfterRender } from "app/render";

/**
 * Determines valid menu items given a menu type.
 * @param {"add" | "delete" | "move" | "all"} type
 * @return {MenuItem[]}
 * */
function getMenuItems(type) {
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

  // Ask that component for the list of menu items for "type"
  const filteredActionsCurrentComponent = component.getMenuActions(type);
  if (filteredActionsCurrentComponent.length < 1) {
    console.log("no valid actions for focused component");
  }

  // Ask the component for its parent
  if (!component.parent) {
    console.log("no parent"); // return?
  }

  console.log({
    currentComponent: component,
    parent: component.parent,
  });

  // Ask parent of component for the list of menu items for "type",
  // if parent exists and is not DesignerTabControl,
  // type is NOT move, and
  // component is NOT stack, page, or PatternGroup
  const filteredActions =
    component.parent &&
    component.parent.className !== "DesignerTabControl" &&
    type !== "move" &&
    component.className !== "Stack" &&
    component.className !== "Page" &&
    component.className !== "PatternGroup"
      ? filteredActionsCurrentComponent.concat(
          component.parent.getMenuActions(type)
        )
      : filteredActionsCurrentComponent;
  if (filteredActions.length < 1) {
    console.log("no valid actions");
    return [];
  }

  let filteredActionsToMenuItems = filteredActions.map((action) => {
    return new MenuItem(
      action instanceof MenuActionMove
        ? action.step < 0
          ? "Up"
          : "Down"
        : `${action.className}`,
      () => {
        // render(where, html`<!--empty-->`);
        const nextId = action.apply();
        console.log({ nextId, panel });
        // we're looking for the settings view but we have the id of the user view
        panel.lastFocused = nextId + "-settings";
        callAfterRender(() => panel.parent.restoreFocus());
        panel.update();
      }
    );
  });

  // console.log(filteredActionsToMenuItems);
  return filteredActionsToMenuItems;
}

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");

    this.menus = [
      new Menu("Add", getMenuItems, "add"),
      new Menu("Delete", getMenuItems, "delete"),
      new Menu("Move", getMenuItems, "move"),
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
          ${this.menus.map((menu) => menu.render())}
        </span>
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");

export default toolbar;
