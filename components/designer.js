import { html } from "uhtml";
import { Base } from "./base";
import { TabControl, TabPanel } from "./tabcontrol";
import { Layout } from "./layout";
import { Actions } from "./actions";
import { Access } from "./access";
import { Content } from "./content";
import css from "ustyler";

export class Designer extends Base {
  /**
   * @param {SomeProps} props
   * @param {Context} context
   * @param {Base|Null} parent
   */
  constructor(props, context, parent) {
    super(props, context, parent);
    const tabs = new TabControl(
      { scale: "10", tabEdge: "top", stateName: "designerTab" },
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
    actionPanel.children = [new Actions({}, this.context, actionPanel)];

    const accessPanel = new TabPanel(
      {
        name: "Access",
        background: "bluish white",
      },
      this.context,
      tabs
    );
    accessPanel.children = [new Access({}, this.context, accessPanel)];

    const contentPanel = new TabPanel(
      {
        name: "Content",
        background: "yellowish white",
      },
      this.context,
      tabs
    );
    contentPanel.children = [new Content({}, this.context, contentPanel)];

    tabs.children = [layoutPanel, actionPanel, accessPanel, contentPanel];
    /** @type {Base[]} */
    this.children = [tabs];
  }

  template() {
    return html`${this.children.map((child) => child.template())} `;
  }
}

css`
  body.designing {
    display: grid;
    grid-template-rows: 2.5em 50% auto;
    grid-template-columns: 50% 50%;
  }

  body.designing div#UI {
    font-size: 0.7vw;
    flex: 1 1 0;
  }

  div#designer {
    display: none;
  }

  body.designing div#designer {
    display: block;
    overflow-y: auto;
    flex: 1 1 0;
    grid-row-start: 1;
    grid-row-end: 4;
    grid-column-start: 2;
  }
  body.designing #UI {
    position: relative;
  }
  body.designing #monitor {
    grid-row-start: 3;
    grid-column-start: 1;
  }
  body.designing #toolbar {
    grid-row-start: 1;
    grid-column-start: 1;
  }
`;
