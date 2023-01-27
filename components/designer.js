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

  /** @type {DesignerPanel | undefined} */
  currentPanel = undefined;

  hint = "T";

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
    if (!this.currentPanel) return;
    const panel = document.getElementById(this.currentPanel.id);
    if (!panel) return;
    for (const element of panel.querySelectorAll("[aria-selected]")) {
      element.removeAttribute("aria-selected");
    }
    const id = event.target.closest("[id]")?.id || "";
    this.currentPanel.lastFocused = id;
    event.target.setAttribute("aria-selected", "true");
  };

  /** @returns {TreeBase | null} */
  get selectedComponent() {
    // Figure out which tab is active
    const { designer } = Globals;
    const panel = designer.currentPanel;

    // Ask that tab which component is focused
    if (!panel?.lastFocused) {
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
          const m = targetId.match(/^TreeBase-\d+/);
          if (m) {
            const prefix = m[0];
            elem = document.querySelector(`[id^=${prefix}]`);
          }
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
            // console.log("send focus to element in panel");
          } else {
            panelNode.focus();
            // console.log("send focus to empty panel");
          }
        }
      }
    }
  }
  /**
   * @param {KeyboardEvent} event
   */
  panelKeyHandler = (event) => {
    if (event.target instanceof HTMLTextAreaElement) return;
    if (event.key != "ArrowDown" && event.key != "ArrowUp") return;
    // get the components on this panel
    // todo expand this to all components
    const components = [...document.querySelectorAll(".panels .settings")];
    // determine which one contains the focus
    const focusedComponent = document.querySelector(
      '.panels .settings:has([aria-selected="true"]):not(:has(.settings [aria-selected="true"]))'
    );
    if (!focusedComponent) return;
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

  /**
   * @param {KeyboardEvent} event
   */
  tabButtonKeyHandler = ({ key }) => {
    console.log({ key });
    const tabButtons = /** @type {HTMLButtonElement[]} */ ([
      ...document.querySelectorAll("#designer .tabcontrol .buttons button"),
    ]);
    const focused = /** @type {HTMLButtonElement} */ (
      document.querySelector("#designer .tabcontrol .buttons button:focus")
    );
    if (key == "Escape") {
      Globals.designer.restoreFocus();
    } else if (key.startsWith("Arrow")) {
      const index = tabButtons.indexOf(focused);
      const step = key == "ArrowUp" || key == "ArrowLeft" ? -1 : 1;
      let nextIndex = (index + step + tabButtons.length) % tabButtons.length;
      tabButtons[nextIndex].focus();
    } else if (key == "Home") {
      tabButtons[0].focus();
    } else if (key == "End") {
      tabButtons[tabButtons.length - 1].focus();
    } else if (
      key.length == 1 &&
      ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z"))
    ) {
      const index = tabButtons.indexOf(focused);
      for (let i = 1; i < tabButtons.length; i++) {
        const j = (index + i) % tabButtons.length;
        if (tabButtons[j].innerText.toLowerCase().startsWith(key)) {
          tabButtons[j].focus();
          break;
        }
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

  /** @type {string[]} */
  allowedChildren = [];

  /**
   * Load a panel from the database.
   *
   * I don't know why I have to pass the class as a parameter to get the types
   * to work. Why can't I refer to this in the static method which should be
   * the class.
   *
   * @template {DesignerPanel} T
   * @param {new()=>T} expected
   * @returns {Promise<T | undefined>}
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
