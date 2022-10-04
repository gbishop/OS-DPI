import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { TabControl, TabPanel } from "./tabcontrol";
import css from "ustyler";

export class Designer extends TabControl {
  /* TOFIX 
    const contentPanel = new TabPanel(
      {
        name: "Content",
        background: "#fff8f8",
      },
      tabs
    );
    contentPanel.children = [new Content({}, contentPanel)];
    */

  /* TOFIX
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
    */

  settings() {
    console.log("settings", this);
    return html`<div class="Designer">
      ${this.children.map((child) => child.settings())}
    </div> `;
  }
}
TreeBase.register(Designer);

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
