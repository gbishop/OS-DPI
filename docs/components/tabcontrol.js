import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";
import css from "../_snowpack/pkg/ustyler.js";

export class TabControl extends Base {
  static defaultProps = {
    stateName: "a-tab-control",
    activeTab: "",
    background: "",
    scale: "6",
    tabEdge: "bottom",
  };
  static allowedChildren = ["tab panel"];

  template() {
    const { state } = this.context;
    const panels = /** @type {TabPanel[]} */ (this.children);
    let activeTabName = state.get(this.props.stateName);
    const buttons = panels
      .filter((panel) => panel.props.label != "UNLABELED")
      .map((panel, index) => {
        const tabName = state.interpolate(panel.props.name); // internal name
        const tabLabel = state.interpolate(
          panel.props.label || panel.props.name
        ); // display name
        const color = panel.props.background;
        if (index == 0 && !activeTabName) {
          activeTabName = tabName;
        }
        const active = activeTabName == tabName || panels.length === 1;
        panel.active = active;
        const buttonStyle = {
          backgroundColor: color,
        };
        return html`<button
          ?active=${active}
          style=${styleString(buttonStyle)}
          onClick=${() => state.update({ [this.props.stateName]: tabName })}
          .dataset=${{ id: panel.id }}
        >
          ${tabLabel}
        </button>`;
      });
    const panel = panels.find((panel) => panel.active)?.template() || html``;
    return html`<div
      class=${["tabcontrol", "flex", this.props.tabEdge].join(" ")}
      id=${this.id}
    >
      <div class="panels flex" }>${panel}</div>
      <div class="buttons">${buttons}</div>
    </div>`;
  }
}
componentMap.addMap("tab control", TabControl);

export class TabPanel extends Base {
  active = false;

  static defaultProps = {
    background: "",
    name: "",
    label: "",
  };
  static allowedChildren = ["stack", "grid", "display", "radio"];

  template() {
    return html`<div
      class="tabpanel flex column"
      style=${styleString({ backgroundColor: this.props.background })}
      id=${this.id}
    >
      ${this.children.map((child) => child.template())}
    </div>`;
  }
  /* for the designer */
}
componentMap.addMap("tab panel", TabPanel);

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
`;
