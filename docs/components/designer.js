import { html } from "../_snowpack/pkg/uhtml.js";
import { Base } from "./base.js";
import { TabControl, TabPanel } from "./tabcontrol.js";
import { Layout } from "./layout.js";
import { Actions } from "./actions.js";
import { AccessMethod } from "./access/method/index.js";
import { AccessPattern } from "./access/pattern/index.js";
import { AccessCues } from "./access/cues/index.js";
import { Content } from "./content.js";
import css from "../_snowpack/pkg/ustyler.js";
import { Logging } from "./logging.js";

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
        background: "#fff8f8",
      },
      tabs
    );
    contentPanel.children = [new Content({}, contentPanel)];

    const layoutPanel = new TabPanel(
      {
        name: "Layout",
        background: "#fffff8",
      },
      tabs
    );
    layoutPanel.children = [new Layout({}, layoutPanel)];

    const actionPanel = new TabPanel(
      {
        name: "Actions",
        background: "#f8fff8",
      },
      tabs
    );
    actionPanel.children = [new Actions({}, actionPanel)];

    const methodPanel = new TabPanel(
      {
        name: "Methods",
        background: "#f8ffff",
      },
      tabs
    );
    methodPanel.children = [new AccessMethod({}, methodPanel)];

    const patternPanel = new TabPanel(
      {
        name: "Patterns",
        background: "#f8f8ff",
      },
      tabs
    );
    patternPanel.children = [new AccessPattern({}, patternPanel)];

    const cuePanel = new TabPanel(
      {
        name: "Cues",
        background: "#fff8ff",
      },
      tabs
    );
    cuePanel.children = [new AccessCues({}, cuePanel)];

    const loggingPanel = new TabPanel(
      {
        name: "Logging",
        background: "#ffffff",
      },
      tabs
    );
    loggingPanel.children = [new Logging({}, loggingPanel)];

    tabs.children = [
      contentPanel,
      layoutPanel,
      actionPanel,
      methodPanel,
      patternPanel,
      cuePanel,
      loggingPanel,
    ];
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
