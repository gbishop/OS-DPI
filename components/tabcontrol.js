import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { Stack } from "./stack";
import { styleString } from "./style";
import "../css/tabcontrol.css";
import { UpdateAccessData } from "./access";
import Globals from "../globals";
import { callAfterRender } from "../render";
import { updateMenuActions } from "./hotkeys";

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
          /** FIX: this does not belong here. I'm just seeing if the actions stuff works */
          updateMenuActions(this.currentPanel);
        }}
      >
        ${panel}
      </div>
    </div>`;
  }

  restoreFocus() {}
}
TreeBase.register(TabControl, "TabControl");

class DesignerTabControl extends TabControl {
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
          if (focusable) focusable.focus();
        }
      }
    }
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
