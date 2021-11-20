import { html } from "uhtml";
import { Base, toDesign } from "./base";
import { TabControl, TabPanel } from "./tabcontrol";
import { Layout } from "./layout";
import { Actions } from "./actions";
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
    return html`${this.children.map((child) => child.template())}
      <button
        style="display: none"
        onclick=${() => {
          const { tree, rules } = this.context;
          const filename = "design.json";
          const data = {
            layout: toDesign(tree),
            rules: rules.rules,
          };
          const blob = new Blob([JSON.stringify(data)], { type: "text/json" });
          const link = document.createElement("a");
          link.download = filename;
          link.href = window.URL.createObjectURL(blob);
          link.dataset.downloadurl = [
            "text/json",
            link.download,
            link.href,
          ].join(":");

          const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });

          link.dispatchEvent(evt);
          link.remove();
        }}
      >
        Download
      </button> `;
  }
}

css`
  body.designing {
    display: grid;
    grid-template-rows: 50% 50%;
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
`;
