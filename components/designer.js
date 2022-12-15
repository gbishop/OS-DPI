import { html } from "uhtml";
import "css/tabcontrol.css";
import Globals from "app/globals";
import { callAfterRender } from "app/render";
import { TreeBase } from "./treebase";
import { TabControl, TabPanel } from "./tabcontrol";
import db from "app/db";

/**
 * Customize the TabControl for use in the Designer interface
 */
export class Designer extends TabControl {
  allowDelete = false;

  /** @type {DesignerPanel} */
  currentPanel = null;

  panelTemplate() {
    return this.currentPanel?.settings() || html`<!--empty-->`;
  }

  /**
   * @param {string} tabName
   */
  switchTab(tabName) {
    callAfterRender(() => this.restoreFocus());
    super.switchTab(tabName);
  }

  /**
   * capture focusin events so we can remember what was focused last
   * @param {FocusEvent} event
   */
  focusin = (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const panel = document.getElementById(this.currentPanel.id);
    for (const element of panel.querySelectorAll("[aria-selected]")) {
      element.removeAttribute("aria-selected");
    }
    const id = event.target.closest("[id]").id;
    this.currentPanel.lastFocused = id;
    event.target.setAttribute("aria-selected", "true");
  };

  /** @returns {TreeBase} */
  get selectedComponent() {
    // Figure out which tab is active
    const { designer } = Globals;
    const panel = designer.currentPanel;

    // Ask that tab which component is focused
    if (!panel.lastFocused) {
      console.log("no lastFocused");
      return null;
    }
    const component = TreeBase.componentFromId(panel.lastFocused);
    if (!component) {
      console.log("no component");
      return null;
    }
    return component;
  }

  restoreFocus() {
    if (this.currentPanel) {
      if (this.currentPanel.lastFocused) {
        let targetId = this.currentPanel.lastFocused;
        let elem = document.getElementById(targetId);
        if (!elem) {
          // perhaps this one is embeded, look for something that starts with it
          const prefix = targetId.match(/^TreeBase-\d+/)[0];
          elem = document.querySelector(`[id^=${prefix}]`);
        }
        // console.log(
        //   "restore focus",
        //   elem,
        //   this.currentPanel.lastFocused,
        //   this.currentPanel
        // );
        if (elem) elem.focus();
      } else {
        // console.log("restoreFocus else path");
        const panelNode = document.getElementById(this.currentPanel.id);
        if (panelNode) {
          const focusable = /** @type {HTMLElement} */ (
            panelNode.querySelector(
              "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), " +
                'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
                "summary:not(:disabled)"
            )
          );

          if (focusable) {
            focusable.focus();
            console.log("send focus to element in panel");
          } else {
            panelNode.focus();
            console.log("send focus to empty panel");
          }
        }
      }
    }
  }
  /**
   * @param {KeyboardEvent} event
   */
  keyHandler = (event) => {
    if (event.key != "ArrowDown" && event.key != "ArrowUp") return;
    // get the components on this panel
    // todo expand this to all components
    const components = [...document.querySelectorAll(".panels .settings")];
    // determine which one contains the focus
    const focusedComponent = document.querySelector(
      '.panels .settings:has([aria-selected="true"]):not(:has(.settings [aria-selected="true"]))'
    );
    // get its index
    const index = components.indexOf(focusedComponent);
    // get the next index
    const nextIndex = Math.min(
      components.length - 1,
      Math.max(0, index + (event.key == "ArrowUp" ? -1 : 1))
    );
    if (nextIndex != index) {
      // focus on the first focusable in the next component
      const focusable = /** @type {HTMLElement} */ (
        components[nextIndex].querySelector(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), " +
            'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
            "summary:not(:disabled)"
        )
      );
      if (focusable) {
        focusable.focus();
      }
    }
  };
}
TreeBase.register(Designer, "Designer");

export class DesignerPanel extends TabPanel {
  // where to store in the db
  static tableName = "";
  // default value if it isn't found
  static defaultValue = {};

  /** @returns {string} */
  get staticTableName() {
    // @ts-expect-error
    return this.constructor.tableName;
  }

  /**
   * Load a panel from the database.
   *
   * I don't know why I have to pass the class as a parameter to get the types
   * to work. Why can't I refer to this in the static method which should be
   * the class.
   *
   * @template {DesignerPanel} T
   * @param {new()=>T} expected
   * @returns {Promise<T>}
   */
  static async load(expected) {
    let obj = await db.read(this.tableName, this.defaultValue);
    obj = this.upgrade(obj);
    const result = this.fromObject(obj);
    if (result instanceof expected) {
      result.configure();
      return result;
    }
  }

  /**
   * An opportunity to upgrade the format if needed
   * @param {any} obj
   * @returns {Object}
   */
  static upgrade(obj) {
    return obj;
  }

  configure() {}

  onUpdate() {
    const tableName = this.staticTableName;
    if (tableName) {
      console.log("update", tableName);
      db.write(tableName, this.toObject());
      Globals.state.update();
    }
  }

  async undo() {
    const tableName = this.staticTableName;
    console.log("undo", tableName);
    if (tableName) {
      await db.undo(tableName);
      Globals.restart();
    }
  }
}
