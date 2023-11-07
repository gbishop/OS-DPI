import { html } from "uhtml";
import * as Props from "./props";
import { Stack } from "./stack";
import { styleString } from "./style";
import "css/tabcontrol.css";
import Globals from "app/globals";
import { TreeBase } from "./treebase";
import { callAfterRender } from "app/render";

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

  /** @type {TabPanel | undefined} */
  currentPanel = undefined;

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
    let buttons = [this.empty];
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
              .dataset=${{
                name: this.name.value,
                label: panel.tabLabel,
                component: this.constructor.name,
                id: panel.id,
              }}
              click
              onClick=${() => {
                this.switchTab(panel.tabName);
              }}
              tabindex="-1"
            >
              ${panel.tabLabel}
            </button>
          </li>`;
        });
    }
    this.currentPanel = panels.find((panel) => panel.active);
    const panel = this.panelTemplate();
    return this.component(
      { classes: [this.props.tabEdge] },
      html`
        <ul class="buttons" hint=${this.hint}>
          ${buttons}
        </ul>
        <div class="panels flex">${panel}</div>
      `,
    );
  }

  panelTemplate() {
    return this.currentPanel?.safeTemplate() || this.empty;
  }

  /**
   * @param {string} tabName
   */
  switchTab(tabName) {
    Globals.state.update({ [this.props.stateName]: tabName });
  }

  /** @type {string | null} */
  hint = null;

  restoreFocus() {}
}
TreeBase.register(TabControl, "TabControl");

export class TabPanel extends Stack {
  name = new Props.String("");
  label = new Props.String("");

  /** @type {TabControl | null} */
  parent = null;

  active = false;
  tabName = "";
  tabLabel = "";
  lastFocused = "";

  /**
   * Render the details of a components settings
   */
  settingsDetails() {
    const caption = this.active ? "Active" : "Activate";
    let details = super.settingsDetails();
    if (!Array.isArray(details)) details = [details];
    return [
      ...details,
      html`<button
        id=${this.id + "-activate"}
        ?active=${this.active}
        onclick=${() => {
          if (this.parent) {
            const parent = this.parent;
            callAfterRender(() => {
              Globals.layout.highlight();
            });
            parent.switchTab(this.name.value);
          }
        }}
      >
        ${caption}
      </button>`,
    ];
  }

  highlight() {}
}
TreeBase.register(TabPanel, "TabPanel");
