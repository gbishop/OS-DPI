import { html } from "../_snowpack/pkg/uhtml.js";
import { Base } from "./base.js";
import { TabControl, TabPanel } from "./tabcontrol.js";
import { Layout } from "./layout.js";
import { Actions } from "./actions.js";
import { AccessPattern } from "./access-pattern.js";
import { Access } from "./access.js";
import { Content } from "./content.js";
import css from "../_snowpack/pkg/ustyler.js";
import { Globals } from "../start.js";

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

    const patternPanel = new TabPanel(
      {
        name: "Access Pattern",
        background: "bluish white",
      },
      tabs
    );
    patternPanel.children = [new AccessPattern({}, patternPanel)];

    const accessPanel = new TabPanel(
      {
        name: "Access",
        background: "bluish white",
      },
      tabs
    );
    accessPanel.children = [new Access({}, accessPanel)];

    const contentPanel = new TabPanel(
      {
        name: "Content",
        background: "yellowish white",
      },
      tabs
    );
    contentPanel.children = [new Content({}, contentPanel)];

    tabs.children = [layoutPanel, actionPanel, patternPanel, contentPanel];
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
