import { html } from "uhtml";
import * as Props from "./props";
import { Stack } from "./stack";
import { styleString } from "./style";
import "css/tabcontrol.css";
import { UpdateAccessData } from "./access";
import Globals from "app/globals";
import { callAfterRender } from "app/render";
import { MenuItem } from "./menu";
import {
  TreeBase,
  MenuActionAdd,
  MenuActionDelete,
  MenuActionMove,
} from "./treebase";

export class TabControl extends TreeBase {
  stateName = new Props.String("$tabControl");
  background = new Props.String("");
  scale = new Props.Float(6);
  tabEdge = new Props.Select(["bottom", "top", "left", "right", "none"]);
  name = new Props.String("tabs");

  allowedChildren = ["TabPanel"];

  /** @type {TabPanel[]} */
  children = [];

  /** @type {TabPanel} */
  currentPanel = null;

  template() {
    const { state } = Globals;
    const panels = this.children;
    let activeTabName = state.get(this.props.stateName);
    // collect panel info
    panels.forEach((panel, index) => {
      panel.tabName = state.interpolate(panel.props.name); // internal name
      panel.tabLabel = state.interpolate(panel.props.label || panel.props.name); // display name
      if (index == 0 && !activeTabName) {
        activeTabName = panel.tabName;
        state.define(this.props.stateName, panel.tabName);
      }
      panel.active = activeTabName == panel.tabName || panels.length === 1;
    });
    let buttons = [html`<!--empty-->`];
    if (this.props.tabEdge != "none") {
      buttons = panels
        .filter((panel) => panel.props.label != "UNLABELED")
        .map((panel, index) => {
          const color = panel.props.background;
          const buttonStyle = {
            backgroundColor: color,
          };
          return html`<button
            ?active=${panel.active}
            style=${styleString(buttonStyle)}
            ref=${UpdateAccessData({
            name: this.name,
            label: panel.tabLabel,
            component: this.constructor.name,
            onClick: () => {
              if (this instanceof DesignerTabControl) {
                callAfterRender(() => this.restoreFocus());
              }
              state.update({ [this.props.stateName]: panel.tabName });
            },
          })}
            .dataset=${{ id: panel.id }}
          >
            ${panel.tabLabel}
          </button>`;
        });
    }
    this.currentPanel = panels.find((panel) => panel.active);
    const panel = this.currentPanel?.template() || html`<!--empty-->`;
    return html`<div
      class=${["tabcontrol", "flex", this.props.tabEdge].join(" ")}
      id=${this.id}
    >
      <div class="buttons">${buttons}</div>
      <div
        class="panels flex"
        onfocusin=${({ target }) => {
        this.currentPanel && (this.currentPanel.lastFocused = target.id);
      }}
      >
        ${panel}
      </div>
    </div>`;
  }

  // note on focus: toggle; go to last place focused
  // way to tab to menu bar
  // no tab traps
  // toolbar on right
  // aria-labeled for buttons...
  restoreFocus() { }

}

TreeBase.register(TabControl, "TabControl");

class DesignerTabControl extends TabControl {
  allowDelete = false;

  settings() {
    return super.template();
  }

  restoreFocus() {
    if (this.currentPanel) {
      if (this.currentPanel.lastFocused) {
        const elem = document.getElementById(this.currentPanel.lastFocused);
        console.log(
          "restore focus",
          elem,
          this.currentPanel.lastFocused,
          this.currentPanel
        );
        if (elem) elem.focus();
      } else {
        console.log("restoreFocus else path");
        const panelNode = document.getElementById(this.currentPanel.id);
        if (panelNode) {
          const focusable = /** @type {HTMLElement} */ (
            panelNode.querySelector(
              "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), " +
              'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
              "summary:not(:disabled)"
            )
          );
          
          if (focusable) {
            focusable.focus();
            console.log("send focus to element in panel");
          } else {
            panelNode.focus();
            console.log("send focus to empty panel")
          }
        }
      }
    }
  }

  /**
 * Determines valid menu items given a menu type.
 * @param {"add" | "delete" | "move" | "all"} type 
 * @return {MenuItem[]}
 * */
  getMenuItems(type) {
    // Figure out which tab is active
    const { designer } = Globals;
    const panel = designer.currentPanel;

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
      parent: component.parent
    });

    // Ask parent of component for the list of menu items for "type", 
    // if parent exists and is not DesignerTabControl, 
    // type is NOT move, and
    // component is NOT stack or page or DesignerTabControl
    const filteredActions = (component.parent &&
      component.parent.className !== "DesignerTabControl" &&
      type !== "move" &&
      component.className !== "Stack" &&
      component.className !== "Page") ?
      filteredActionsCurrentComponent.concat(component.parent.getMenuActions(type))
      : filteredActionsCurrentComponent;
    if (filteredActions.length < 1) {
      console.log("no valid actions");
      return;
    }

    let filteredActionsToMenuItems = filteredActions.map((action) => {
      return new MenuItem((action instanceof MenuActionMove ? ((action.step < 0) ? "Up" : "Down") : `${action.className}`), () => {
        // render(where, html`<!--empty-->`);
        const nextId = action.apply();
        console.log({ nextId, panel });
        // we're looking for the settings view but we have the id of the user view
        panel.lastFocused = nextId + "-settings";
        callAfterRender(() => panel.parent.restoreFocus());
        panel.update();
      });
    });

    // console.log(filteredActionsToMenuItems);
    return filteredActionsToMenuItems;
  }
}
TreeBase.register(DesignerTabControl, "DesignerTabControl");

export class TabPanel extends Stack {
  name = new Props.String("");
  label = new Props.String("");

  /** @type {TabControl} */
  parent = null;

  active = false;
  tabName = "";
  tabLabel = "";
  lastFocused = "";
}
TreeBase.register(TabPanel, "TabPanel");