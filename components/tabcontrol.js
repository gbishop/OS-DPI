import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { Stack } from "./stack";
import { styleString } from "./style";
import css from "ustyler";
import { UpdateAccessData } from "./access";
import Globals from "../globals";

export class TabControl extends TreeBase {
  stateName = new Props.String("$tabControl");
  background = new Props.String("");
  scale = new Props.Float(6);
  tabEdge = new Props.Select(["bottom", "top", "left", "right", "none"]);
  name = new Props.String("tabs");

  allowedChildren = ["tab panel"];

  /** @type {TabPanel[]} */
  children = [];

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
        console.log({ index, activeTabName, n: this.props.stateName });
        state.define(this.props.stateName, panel.tabName);
      }
      panel.active = activeTabName == panel.tabName || panels.length === 1;
    });
    console.log({ panels });
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
                state.update({ [this.props.stateName]: panel.tabName });
              },
            })}
            .dataset=${{ id: panel.id }}
          >
            ${panel.tabLabel}
          </button>`;
        });
    }
    const panel =
      panels.find((panel) => panel.active)?.template() || html`<!--empty-->`;
    return html`<div
      class=${["tabcontrol", "flex", this.props.tabEdge].join(" ")}
      id=${this.id}
    >
      <div class="panels flex" }>${panel}</div>
      <div class="buttons">${buttons}</div>
    </div>`;
  }
}
TreeBase.register(TabControl);

export class TabPanel extends Stack {
  active = false;
  tabName = "";
  tabLabel = "";

  background = new Props.Color("");
  name = new Props.String("");
  label = new Props.String("");
  direction = new Props.Select(["row", "column"]);
  scale = new Props.Float(1);

  allowedChildren = [
    "stack",
    "grid",
    "display",
    "radio",
    "tab control",
    "vsd",
    "button",
  ];
}
TreeBase.register(TabPanel);

css`
  .tabcontrol .buttons button:focus {
    outline: 0;
  }
  .tabcontrol .panels {
    display: flex;
  }
  .tabcontrol .buttons {
    display: flex;
  }
  .tabcontrol .buttons button {
    flex: 1 1 0;
  }
  .tabcontrol .buttons button[active] {
    font-weight: bold;
  }

  .tabcontrol.top {
    flex-direction: column;
  }
  .tabcontrol.top .panels {
    order: 2;
  }
  .tabcontrol.top .buttons {
    order: 1;
  }
  .tabcontrol.top .buttons button[active] {
    border-bottom: 1px;
    margin-top: 0px;
  }
  .tabcontrol.top .buttons button {
    border-top-left-radius: 1em;
    border-top-right-radius: 1em;
    margin-top: 10px;
  }

  .tabcontrol.bottom {
    flex-direction: column;
  }
  .tabcontrol.bottom .panels {
    order: 1;
  }
  .tabcontrol.bottom .buttons {
    order: 2;
  }
  .tabcontrol.bottom .buttons button[active] {
    border-top: 1px;
    margin-bottom: 0px;
  }
  .tabcontrol.bottom .buttons button {
    border-bottom-left-radius: 1em;
    border-bottom-right-radius: 1em;
    margin-bottom: 10px;
  }

  .tabcontrol.right {
    flex-direction: row;
  }
  .tabcontrol.right .panels {
    order: 1;
  }
  .tabcontrol.right .buttons {
    order: 2;
    flex-direction: column;
  }
  .tabcontrol.right .buttons button[active] {
    border-left: 1px;
    margin-right: 0;
  }
  .tabcontrol.right .buttons button {
    border-top-right-radius: 1em;
    border-bottom-right-radius: 1em;
    margin-right: 10px;
  }

  .tabcontrol.left {
    flex-direction: row;
  }
  .tabcontrol.left .panels {
    order: 2;
    flex: 1;
  }
  .tabcontrol.left .buttons {
    order: 1;
    flex-direction: column;
    flex: 1;
  }
  .tabcontrol.left .buttons button[active] {
    border-right: 1px;
    margin-left: 0;
  }
  .tabcontrol.left .buttons button {
    border-top-left-radius: 1em;
    border-bottom-left-radius: 1em;
    margin-left: 10px;
  }

  .tabcontrol.none .buttons {
    display: none;
  }
`;
