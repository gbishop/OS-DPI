import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { DesignerPanel } from "./designer";
import "css/layout.css";
import db from "app/db";
import Globals from "app/globals";

const emptyPage = {
  className: "Page",
  props: {},
  children: [
    {
      className: "Speech",
      props: {},
      children: [],
    },
  ],
};

// map old names to new for the transition
const typeToClassName = {
  audio: "Audio",
  stack: "Stack",
  page: "Page",
  grid: "Grid",
  speech: "Speech",
  button: "Button",
  logger: "Logger",
  gap: "Gap",
  option: "Option",
  radio: "Radio",
  vsd: "VSD",
  "modal dialog": "ModalDialog",
  "tab control": "TabControl",
  "tab panel": "TabPanel",
  display: "Display",
};

export class Layout extends DesignerPanel {
  allowDelete = false;

  static tableName = "layout";
  static defaultValue = emptyPage;

  settings() {
    return html`<div class="treebase layout" help="Layout tab" id=${this.id}>
      ${this.children[0].settings()}
    </div>`;
  }

  allowedChildren = ["Page"];

  /**
   * An opportunity to upgrade the format if needed
   * @param {any} obj
   * @returns {Object}
   */
  static upgrade(obj) {
    function oldToNew(obj) {
      if ("type" in obj) {
        // console.log("upgrade", obj);
        // convert to new representation
        const newObj = {
          children: obj.children.map((child) => oldToNew(child)),
        };
        if ("filters" in obj.props) {
          for (const filter of obj.props.filters) {
            newObj.children.push({
              className: "GridFilter",
              props: { ...filter },
              children: [],
            });
          }
        }
        newObj.className = typeToClassName[obj.type];
        const { filters, ...props } = obj.props;
        newObj.props = props;
        obj = newObj;
        // console.log("upgraded", obj);
      }
      return obj;
    }
    obj = oldToNew(obj);
    // upgrade from the old format
    return {
      className: "Layout",
      props: { name: "Layout" },
      children: [obj],
    };
  }

  toObject(persist = true) {
    return this.children[0].toObject(persist);
  }

  /** Update the state
   */
  onUpdate() {
    db.write("layout", this.children[0].toObject());
    Globals.state.update();
  }
}
TreeBase.register(Layout, "Layout");
