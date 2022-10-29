import { html } from "uhtml";
import { Base } from "./base";
import { TabControl, TabPanel } from "./tabcontrol";
import { Layout } from "./layout";
import { Actions } from "./actions";
import { Access } from "./access";
import { Content } from "./content";
import "../css/designer.css";
import { Logging } from "./logger";

export class Designer extends Base {
  /**
   * @param {SomeProps} props
   * @param {Base|Null} parent
   */
  constructor(props, parent) {
    super(props, parent);
    const tabs = new TabControl(
      { scale: "10", tabEdge: "top", stateName: "designerTab" },
      this
    );

    const contentPanel = new TabPanel(
      {
        name: "Content",
        background: "yellowish white",
      },
      tabs
    );
    contentPanel.children = [new Content({}, contentPanel)];

    const layoutPanel = new TabPanel(
      {
        name: "Layout",
        background: "pinkish white",
      },
      tabs
    );
    layoutPanel.children = [new Layout({}, layoutPanel)];

    const actionPanel = new TabPanel(
      {
        name: "Actions",
        background: "greenish white",
      },
      tabs
    );
    actionPanel.children = [new Actions({}, actionPanel)];

    const accessPanel = new TabPanel(
      {
        name: "Access",
        background: "yellowish white",
      },
      tabs
    );
    accessPanel.children = [new Access({}, accessPanel)];

    const loggingPanel = new TabPanel(
      {
        name: "Logging",
        background: "pinkish white",
      },
      tabs
    );
    loggingPanel.children = [new Logging({}, loggingPanel)];

    tabs.children = [
      contentPanel,
      layoutPanel,
      actionPanel,
      accessPanel,
      loggingPanel,
    ];
    /** @type {Base[]} */
    this.children = [tabs];
  }

  template() {
    return html`${this.children.map((child) => child.template())} `;
  }
}
