import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

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
    const divStyle = {
      flexGrow: this.props.scale,
    };
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
        >
          ${tabLabel}
        </button>`;
      });
    const panel = panels.find((panel) => panel.active)?.template() || html``;
    const panelsStyle = { flexGrow: this.props.scale };
    return html`<div
      class=${["tabcontrol", "flex", this.props.tabEdge].join(" ")}
      style=${styleString(divStyle)}
      id=${this.id}
    >
      <div class="panels" style=${styleString(panelsStyle)}>${panel}</div>
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
