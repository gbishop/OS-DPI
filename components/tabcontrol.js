import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

const tabStyle = {
  bottom: {
    div: {
      flexDirection: "column",
    },
    panel: {
      order: "1",
    },
    tabs: {
      order: "2",
    },
    buttonActive: {
      borderTop: "1px",
      borderBottomLeftRadius: "1em",
      borderBottomRightRadius: "1em",
    },
    buttonInactive: {
      borderBottom: 0,
      borderBottomLeftRadius: "1em",
      borderBottomRightRadius: "1em",
    },
  },
  top: {
    div: {
      flexDirection: "column",
    },
    panel: {
      order: "2",
    },
    tabs: {
      order: "1",
    },
    buttonActive: {
      borderBottom: "1px",
      borderTopLeftRadius: "1em",
      borderTopRightRadius: "1em",
    },
    buttonInactive: {
      borderTop: 0,
      borderTopLeftRadius: "1em",
      borderTopRightRadius: "1em",
    },
  },
  right: {
    div: {
      flexDirection: "row",
    },
    panel: {
      order: "1",
    },
    tabs: {
      order: "2",
      flexDirection: "column",
    },
    buttonActive: {
      borderLeft: "1px",
      borderTopRightRadius: "1em",
      borderBottomRightRadius: "1em",
    },
    buttonInactive: {
      borderRight: 0,
      borderTopRightRadius: "1em",
      borderBottomRightRadius: "1em",
    },
  },
  left: {
    div: {
      flexDirection: "row",
    },
    panel: {
      order: "2",
    },
    tabs: {
      order: "1",
      flexDirection: "column",
    },
    buttonActive: {
      borderRight: "1px",
      borderTopLeftRadius: "1em",
      borderBottomLeftRadius: "1em",
    },
    buttonInactive: {
      borderLeft: 0,
      borderTopLeftRadius: "1em",
      borderBottomLeftRadius: "1em",
    },
  },
};

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
    const styles = tabStyle[this.props.tabEdge];
    const divStyle = Object.assign(
      {
        flexGrow: this.props.scale,
        backgroundColor: this.props.background,
      },
      styles.div
    );
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
        panel.active = active;
        const buttonStyle = Object.assign(
          {
            backgroundColor: color,
          },
          active ? styles.buttonActive : styles.buttonInactive
        );
        return html`<button
          style=${styleString(buttonStyle)}
          onClick=${() => state.update({ [this.props.stateName]: tabName })}
        >
          ${tabLabel}
        </button>`;
      });
    const panel = panels.find((panel) => panel.active)?.template() || html``;
    const panelStyle = Object.assign(
      { flexGrow: this.props.scale },
      styles.panel
    );
    return html`<div
      class="tabcontrol flex column"
      style=${styleString(divStyle)}
      id=${this.id}
    >
      <div class="panels" style=${styleString(panelStyle)}>${panel}</div>
      <div class="buttons" style=${styleString(styles.tabs)}>${buttons}</div>
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
      class="tabpanel flex"
      style=${styleString({ backgroundColor: this.props.background })}
      id=${this.id}
    >
      ${this.children.map((child) => child.template())}
    </div>`;
  }
  /* for the designer */
}
componentMap.addMap("tab panel", TabPanel);
