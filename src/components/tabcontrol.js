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
  background = new Props.Color("");
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
    let activeTabName = state.get(this.stateName.value);
    // collect panel info
    panels.forEach((panel, index) => {
      panel.tabName = state.interpolate(panel.name.value); // internal name
      panel.tabLabel = state.interpolate(panel.label.value || panel.name.value); // display name
      if (index == 0 && !activeTabName) {
        activeTabName = panel.tabName;
        state.define(this.stateName.value, panel.tabName);
      }
      panel.active = activeTabName == panel.tabName || panels.length === 1;
    });
    let buttons = [];
    if (this.tabEdge.value != "none") {
      buttons = panels
        .filter((panel) => panel.label.value != "UNLABELED")
        .map((panel) => {
          const color = panel.background.value;
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
              @Activate=${() => {
                this.switchTab(panel.tabName);
              }}
              tabindex="-1"
            >
              ${panel.tabLabel}
            </button>
          </li>`;
        });
    }
    return this.component(
      { classes: [this.tabEdge.value] },
      html`
        <ul class="buttons">
          ${buttons}
        </ul>
        <div class="panels flex">
          ${panels.map((panel) => panel.safeTemplate())}
        </div>
      `,
    );
  }

  /**
   * @param {string} tabName
   */
  switchTab(tabName) {
    Globals.state.update({ [this.stateName.value]: tabName });
  }
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

  /** @param {string[]} classes
   * @returns {string}
   */
  CSSClasses(...classes) {
    if (this.active) {
      classes.push("ActivePanel");
    }
    return super.CSSClasses(...classes);
  }

  highlight() {}
}
TreeBase.register(TabPanel, "TabPanel");
