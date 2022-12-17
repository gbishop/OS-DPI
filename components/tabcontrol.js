import { html } from "uhtml";
import * as Props from "./props";
import { Stack } from "./stack";
import { styleString } from "./style";
import "css/tabcontrol.css";
import { UpdateAccessData } from "./access";
import Globals from "app/globals";
import { TreeBase } from "./treebase";

export class TabControl extends TreeBase {
  stateName = new Props.String("$tabControl");
  background = new Props.String("");
  scale = new Props.Float(6);
  tabEdge = new Props.Select(["bottom", "top", "left", "right", "none"], {
    defaultValue: "top",
  });
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
        .map((panel) => {
          const color = panel.props.background;
          const buttonStyle = {
            backgroundColor: color,
          };
          return html`<li>
            <button
              ?active=${panel.active}
              style=${styleString(buttonStyle)}
              ref=${UpdateAccessData({
                name: this.name,
                label: panel.tabLabel,
                component: this.constructor.name,
                onClick: () => {
                  this.switchTab(panel.tabName);
                },
              })}
              .dataset=${{ id: panel.id }}
              tabindex="-1"
            >
              ${panel.tabLabel}
            </button>
          </li>`;
        });
    }
    this.currentPanel = panels.find((panel) => panel.active);
    const panel = this.panelTemplate();
    return html`<div
      class=${["tabcontrol", "flex", this.props.tabEdge].join(" ")}
      id=${this.id}
    >
      <ul class="buttons" onkeydown=${this.tabButtonKeyHandler}>
        ${buttons}
      </ul>
      <div
        class="panels flex"
        onfocusin=${this.focusin}
        onkeydown=${this.panelKeyHandler}
      >
        ${panel}
      </div>
    </div>`;
  }

  panelTemplate() {
    return this.currentPanel?.template() || html`<!--empty-->`;
  }

  /**
   * @param {string} tabName
   */
  switchTab(tabName) {
    Globals.state.update({ [this.props.stateName]: tabName });
  }

  focusin = null;

  panelKeyHandler = null;

  tabButtonKeyHandler = null;

  restoreFocus() {}
}
TreeBase.register(TabControl, "TabControl");

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
