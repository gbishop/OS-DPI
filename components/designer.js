import { html } from "uhtml";
import { Base } from "./base";
import { TabControl, TabPanel } from "./tabcontrol";
import { Layout } from "./layout";

export class Designer extends Base {
  /**
   * @param {Props} props
   * @param {Context} context
   * @param {Base} parent
   */
  constructor(props, context, parent) {
    super(props, context, parent);
    const tabs = new TabControl(
      { scale: "10", tabEdge: "top" },
      this.context,
      this
    );
    const layoutPanel = new TabPanel(
      {
        name: "Layout",
        background: "pinkish white",
      },
      this.context,
      tabs
    );
    layoutPanel.children = [new Layout({}, this.context, layoutPanel)];
    const actionPanel = new TabPanel(
      {
        name: "Actions",
        background: "greenish white",
      },
      this.context,
      tabs
    );
    const accessPanel = new TabPanel(
      {
        name: "Access",
        background: "bluish white",
      },
      this.context,
      tabs
    );
    const contentPanel = new TabPanel(
      {
        name: "Content",
        background: "yellowish white",
      },
      this.context,
      tabs
    );
    tabs.children = [layoutPanel, actionPanel, accessPanel, contentPanel];
    /** @type {Base[]} */
    this.children = [tabs];
  }

  template() {
    return html`${this.children.map((child) => child.template())}`;
  }
}
