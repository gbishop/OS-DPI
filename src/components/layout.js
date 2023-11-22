import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { DesignerPanel } from "./designer";
import "css/layout.css";
import db from "app/db";
import Globals from "app/globals";
import { TabPanel } from "./tabcontrol";
import { callAfterRender } from "app/render";
import { ModalDialog } from "./modal-dialog";

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
    return html`<div
      class="treebase layout"
      help="Layout tab"
      id=${this.id}
      onkeydown=${(/** @type {KeyboardEvent} */ event) => {
        const { key, ctrlKey } = event;
        if ((key == "H" || key == "h") && ctrlKey) {
          event.preventDefault();
          this.highlight();
        }
      }}
    >
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
    /** @param {Object} obj */
    function oldToNew(obj) {
      if ("type" in obj) {
        // console.log("upgrade", obj);
        // convert to new representation
        const newObj = {
          children: obj.children.map((/** @type {Object} */ child) =>
            oldToNew(child)
          ),
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

  toObject() {
    return this.children[0].toObject();
  }

  /** Update the state
   */
  onUpdate() {
    db.write("layout", this.children[0].toObject());
    Globals.state.update();
  }

  /** Allow highlighting the current component in the UI
   */
  highlight() {
    // clear any existing highlight
    for (const element of document.querySelectorAll("#UI [highlight]")) {
      element.removeAttribute("highlight");
    }
    // find the selection in the panel
    let selected = document.querySelector("[aria-selected]");
    if (!selected) return;
    selected = selected.closest("[id]");
    if (!selected) return;
    const id = selected.id;
    if (!id) return;
    let component = TreeBase.componentFromId(id);
    if (component) {
      const element = document.getElementById(component.id);
      if (element) {
        element.setAttribute("highlight", "component");
        return;
      }
      // the component is not currently visible. Find its nearest visible parent
      component = component.parent;
      while (component) {
        const element = document.getElementById(component.id);
        if (element) {
          element.setAttribute("highlight", "parent");
          return;
        }
        component = component.parent;
      }
    }
  }

  makeVisible() {
    let component = Globals.designer.selectedComponent;
    if (component) {
      const element = document.getElementById(component.id);
      if (element) {
        return; // already visible
      }
      // climb the tree scheduling updates to parent to make this component visible
      component = component.parent;
      let patch = {};
      while (component) {
        if (
          component instanceof TabPanel &&
          component.parent &&
          component.parent.currentPanel != component
        ) {
          patch[component.parent.stateName.value] = component.name.value;
        } else if (component instanceof ModalDialog) {
          patch[component.stateName.value] = 1;
        }
        component = component.parent;
      }
      callAfterRender(() => this.highlight());
      Globals.state.update(patch);
    }
  }
}
TreeBase.register(Layout, "Layout");
