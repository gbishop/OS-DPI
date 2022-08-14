import { html } from "uhtml";
import { Base } from "./base";
import { TabControl, TabPanel } from "./tabcontrol";
import { Layout } from "./layout";
import { Actions } from "./actions";
import { Access } from "./access";
import { Content } from "./content";
import { Menu } from "./menu";
import css from "ustyler";

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

    tabs.children = [contentPanel, layoutPanel, actionPanel, accessPanel];
    /** @type {Base[]} */
    this.children = [tabs];
  }

  fileMenu = new Menu("File", [{ label: "Export design" }, { label: "Home" }]);
  editMenu = new Menu("Edit", [
    { label: "Delete" },
    { label: "Up" },
    { label: "Down" },
    { label: "Copy" },
    { label: "Paste" },
    { label: "Undo" },
  ]);

  template() {
    return html`
      <div class="toolbar">
        <input type="text" value="My Design" />
        ${this.fileMenu.render()} ${this.editMenu.render()}
      </div>
      ${this.children.map((child) => child.template())}
    `;
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

  .toolbar {
    border: 1px solid black;
    border-radius: 0.5em;
    background-color: #7bafd4;
    padding: 0.25em;
  }
`;
