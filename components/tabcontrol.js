import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

class TabControl extends Base {
  static defaultProps = {
    stateName: "a-tab-control",
    activeTab: "",
    background: "",
    scale: "6",
  };
  static allowedChildren = ["tab panel"];

  template() {
    const { state } = this.context;
    const style = styleString({
      flexGrow: this.props.scale,
      backgroundColor: this.props.background,
    });
    const panels = /** @type {TabPanel[]} */ (this.children);
    const buttons = panels
      .filter((panel) => panel.props.label != "UNLABELED")
      .map((panel) => {
        const tabName = state.interpolate(panel.props.name); // internal name
        const tabLabel = state.interpolate(
          panel.props.label || panel.props.name
        ); // display name
        const color = panel.props.background;
        const active =
          state.get(this.props.stateName) == tabName || panels.length === 1;
        const style = active
          ? styleString({
              backgroundColor: color,
              borderTopColor: color,
            })
          : "";
        panel.active = active;
        return html`<button
          style=${style}
          onClick=${() => state.update({ [this.props.stateName]: tabName })}
        >
          ${tabLabel}
        </button>`;
      });
    const panel = panels.find((panel) => panel.active)?.template() || html``;
    return html`<div class="tabcontrol flex column" style=${style}>
      <div class="panels" style=${styleString({ flexGrow: this.props.scale })}>
        ${panel}
      </div>
      <div class="buttons">${buttons}</div>
    </div>`;
  }
}
componentMap.addMap("tab control", TabControl);

class TabPanel extends Base {
  active = false;

  static defaultProps = {
    background: "",
    name: "",
    label: "",
  };
  static allowedChildren = ["stack", "grid", "display", "radio"];

  template() {
    return html`<div
      class="tabpanel flex"
      style=${styleString({ backgroundColor: this.props.background })}
    >
      ${this.children.map((child) => child.template())}
    </div>`;
  }
  /* for the designer */
}
componentMap.addMap("tab panel", TabPanel);
