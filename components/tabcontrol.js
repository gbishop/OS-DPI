import { html } from "uhtml";
import * as Props from "./props";
import { Stack } from "./stack";
import { styleString } from "./style";
import "css/tabcontrol.css";
import { UpdateAccessData } from "./access";
import Globals from "app/globals";
import { callAfterRender } from "app/render";
import { TreeBase } from "./treebase";
import db from "app/db";

export class TabControl extends TreeBase {
  stateName = new Props.String("$tabControl");
  background = new Props.String("");
  scale = new Props.Float(6);
  tabEdge = new Props.Select(["bottom", "top", "left", "right", "none"], {
    defaultValue: "top",
  });
  name = new Props.String("tabs");

  allowedChildren = ["TabPanel"];

  /** @type {TabPanel[]} */
  children = [];

  /** @type {TabPanel} */
  currentPanel = null;

  template() {
    const { state } = Globals;
    const panels = this.children;
    let activeTabName = state.get(this.props.stateName);
    // collect panel info
    panels.forEach((panel, index) => {
      panel.tabName = state.interpolate(panel.props.name); // internal name
      panel.tabLabel = state.interpolate(panel.props.label || panel.props.name); // display name
      if (index == 0 && !activeTabName) {
        activeTabName = panel.tabName;
        state.define(this.props.stateName, panel.tabName);
      }
      panel.active = activeTabName == panel.tabName || panels.length === 1;
    });
    let buttons = [html`<!--empty-->`];
    if (this.props.tabEdge != "none") {
      buttons = panels
        .filter((panel) => panel.props.label != "UNLABELED")
        .map((panel) => {
          const color = panel.props.background;
          const buttonStyle = {
            backgroundColor: color,
          };
          return html`<button
            ?active=${panel.active}
            style=${styleString(buttonStyle)}
            ref=${UpdateAccessData({
              name: this.name,
              label: panel.tabLabel,
              component: this.constructor.name,
              onClick: () => {
                this.switchTab(panel.tabName);
              },
            })}
            .dataset=${{ id: panel.id }}
            tabindex="-1"
          >
            ${panel.tabLabel}
          </button>`;
        });
    }
    this.currentPanel = panels.find((panel) => panel.active);
    const panel = this.panelTemplate();
    return html`<div
      class=${["tabcontrol", "flex", this.props.tabEdge].join(" ")}
      id=${this.id}
    >
      <div class="buttons">${buttons}</div>
      <div
        class="panels flex"
        onfocusin=${this.focusin}
        onkeydown=${this.keyHandler}
      >
        ${panel}
      </div>
    </div>`;
  }

  panelTemplate() {
    return this.currentPanel?.template() || html`<!--empty-->`;
  }

  /**
   * @param {string} tabName
   */
  switchTab(tabName) {
    Globals.state.update({ [this.props.stateName]: tabName });
  }

  focusin = null;

  keyHandler = null;

  restoreFocus() {}
}
TreeBase.register(TabControl, "TabControl");

/**
 * Customize the TabControl for use in the Designer interface
 */
export class DesignerTabControl extends TabControl {
  allowDelete = false;

  /** @type {DesignerTabPanel} */
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
TreeBase.register(DesignerTabControl, "DesignerTabControl");

export class TabPanel extends Stack {
  name = new Props.String("");
  label = new Props.String("");

  /** @type {TabControl} */
  parent = null;

  active = false;
  tabName = "";
  tabLabel = "";
  lastFocused = "";
}
TreeBase.register(TabPanel, "TabPanel");

export class DesignerTabPanel extends TabPanel {
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
   * @template {DesignerTabPanel} T
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
