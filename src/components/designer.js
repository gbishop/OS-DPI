import { html } from "uhtml";
import * as Props from "./props";
import { colorNamesDataList } from "./style";
import "css/designer.css";
import Globals from "app/globals";
import { TreeBase } from "./treebase";
import { callAfterRender } from "app/render";
import db from "app/db";
import { ChangeStack } from "./undo";

export class Designer extends TreeBase {
  stateName = new Props.String("$tabControl");
  background = new Props.String("");
  scale = new Props.Float(6);
  name = new Props.String("tabs");

  hint = "T";

  allowedChildren = ["DesignerPanel"];

  /** @type {DesignerPanel[]} */
  children = [];

  /** @type {DesignerPanel | undefined} */
  currentPanel = undefined;

  template() {
    const { state } = Globals;
    const panels = this.children;
    let activeTabName = state.get(this.stateName.value);
    // collect panel info
    panels.forEach((panel, index) => {
      panel.tabName = state.interpolate(panel.name.value); // internal name
      panel.tabLabel = state.interpolate(panel.label.value || panel.name.value); // display name
      if (index == 0 && !activeTabName) {
        activeTabName = panel.tabName;
        state.define(this.stateName.value, panel.tabName);
      }
      panel.active = activeTabName == panel.tabName || panels.length === 1;
      if (panel.active) {
        this.currentPanel = panel;
      }
    });
    let buttons = [];
    buttons = panels
      .filter((panel) => panel.label.value != "UNLABELED")
      .map((panel) => {
        return html`<li>
          <button
            ?active=${panel.active}
            data=${{
              name: this.name.value,
              label: panel.tabLabel,
              component: this.constructor.name,
              id: panel.id,
            }}
            @click=${() => {
              this.switchTab(panel.tabName);
            }}
            tabindex="-1"
          >
            ${panel.tabLabel}
          </button>
        </li>`;
      });
    return this.component(
      { classes: ["top", "tabcontrol"] },
      html`
        <ul class="buttons" hint="T" @keyup=${this.tabButtonKeyHandler}>
          ${buttons}
        </ul>
        <div
          class="panels flex"
          @keydown=${this.keyHandler}
          @focusin=${this.focusin}
          @click=${this.designerClick}
        >
          ${panels.map((panel) => panel.settings())}
        </div>
        ${colorNamesDataList()}
      `,
    );
  }

  /**
   * @param {string} tabName
   */
  switchTab(tabName) {
    callAfterRender(() => this.restoreFocus());
    Globals.state.update({ [this.stateName.value]: tabName });
  }

  /**
   * capture focusin events so we can remember what was focused last
   * @param {FocusEvent} event
   */
  focusin = (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.hasAttribute("aria-selected")) return;
    if (!this.currentPanel) return;
    const panel = document.getElementById(this.currentPanel.id);
    if (!panel) return;
    for (const element of panel.querySelectorAll("[aria-selected]")) {
      element.removeAttribute("aria-selected");
    }
    if (panel.contains(event.target)) {
      const id = event.target.closest("[id]")?.id || "";
      this.currentPanel.lastFocused = id;
      event.target.setAttribute("aria-selected", "true");
    }

    if (this.currentPanel.name.value == "Layout") {
      this.currentPanel.highlight();
    }
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
        if (elem) elem.focus();
      } else {
        const panelNode = document.getElementById(this.currentPanel.id);
        if (panelNode) {
          const focusable = /** @type {HTMLElement} */ (
            panelNode.querySelector(
              "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), " +
                'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
                "summary:not(:disabled)",
            )
          );

          if (focusable) {
            focusable.focus();
          } else {
            panelNode.focus();
          }
        }
      }
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  keyHandler = (event) => {
    if (!this.currentPanel) return;
    if (
      event.target instanceof HTMLButtonElement &&
      event.target.matches("#designer .buttons button")
    ) {
      this.tabButtonKeyHandler(event);
    } else {
      const panel = document.getElementById(this.currentPanel.id);
      if (
        panel &&
        event.target instanceof HTMLElement &&
        panel.contains(event.target)
      ) {
        this.panelKeyHandler(event);
      }
    }
  };
  /**
   * @param {KeyboardEvent} event
   */
  panelKeyHandler(event) {
    if (event.target instanceof HTMLTextAreaElement) return;
    if (event.key == "ArrowDown" || event.key == "ArrowUp") {
      if (event.shiftKey) {
        // move the component
        const component = Globals.designer.selectedComponent;
        if (!component) return;
        component.moveUpDown(event.key == "ArrowUp");
        callAfterRender(() => Globals.designer.restoreFocus());
        this.currentPanel?.update();
        Globals.state.update();
      } else {
        event.preventDefault();
        // get the components on this panel
        // todo expand this to all components
        const components = [
          ...document.querySelectorAll(".DesignerPanel.ActivePanel .settings"),
        ];
        // determine which one contains the focus
        const focusedComponent = document.querySelector(
          '.DesignerPanel.ActivePanel .settings:has([aria-selected="true"]):not(:has(.settings [aria-selected="true"]))',
        );
        if (!focusedComponent) return;
        // get its index
        const index = components.indexOf(focusedComponent);
        // get the next index
        const nextIndex = Math.min(
          components.length - 1,
          Math.max(0, index + (event.key == "ArrowUp" ? -1 : 1)),
        );
        if (nextIndex != index) {
          // focus on the first focusable in the next component
          const focusable = /** @type {HTMLElement} */ (
            components[nextIndex].querySelector(
              "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), " +
                'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
                "summary:not(:disabled)",
            )
          );
          if (focusable) {
            focusable.focus();
          }
        }
      }
    } else if (event.key == "z") {
      if (event.ctrlKey && event.shiftKey) {
        this.currentPanel?.redo();
      } else if (event.ctrlKey) {
        this.currentPanel?.undo();
      }
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  tabButtonKeyHandler({ key }) {
    const tabButtons = /** @type {HTMLButtonElement[]} */ ([
      ...document.querySelectorAll("#designer .buttons button"),
    ]);
    const focused = /** @type {HTMLButtonElement} */ (
      document.querySelector("#designer .buttons button:focus")
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
  }

  /** Tweak the focus behavior in the designer
   * I want clicking on blank space to focus the nearest focusable element

   * @param {PointerEvent} event
   */
  designerClick = (event) => {
    // return if target is not an HTMLElement
    if (!(event.target instanceof HTMLElement)) return;

    const panel = document.querySelector("#designer .designer div.panels");
    // return if not in designer
    if (!panel) return;
    // return if click is not inside the panel
    if (!panel.contains(event.target)) return;
    // check for background elements
    if (
      event.target instanceof HTMLDivElement ||
      event.target instanceof HTMLFieldSetElement ||
      event.target instanceof HTMLTableRowElement ||
      event.target instanceof HTMLTableCellElement ||
      event.target instanceof HTMLDetailsElement
    ) {
      if (event.target.matches('[tabindex="0"]')) return;
      /** @type {HTMLElement | null} */
      let target = event.target;
      while (target) {
        const focusable = /** @type {HTMLElement} */ (
          target.querySelector(
            "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), " +
              'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), ' +
              "summary:not(:disabled)",
          )
        );
        if (focusable) {
          focusable.focus();
          break;
        }
        target = target.parentElement;
      }
    }
  };
}
TreeBase.register(Designer, "Designer");

export class DesignerPanel extends TreeBase {
  name = new Props.String("");
  label = new Props.String("");

  /** @type {Designer | null} */
  parent = null;

  active = false;
  tabName = "";
  tabLabel = "";

  settingsDetailsOpen = false;
  lastFocused = "";

  // where to store in the db
  static tableName = "";
  // default value if it isn't found
  static defaultValue = {};

  /** @returns {string} */
  get staticTableName() {
    // @ts-expect-error
    return this.constructor.tableName;
  }

  changeStack = new ChangeStack();

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
      result.changeStack.save(
        result.toObject({ omittedProps: [], includeIds: true }),
      );
      return result;
    }
    // I don't think this happens
    return this.create(expected);
  }

  /**
   * Render the details of a components settings
   */
  settingsDetails() {
    const caption = this.active ? "Active" : "Activate";
    let details = super.settingsDetails();
    if (!Array.isArray(details)) details = [details];
    return [
      ...details,
      html`<button
        id=${this.id + "-activate"}
        ?active=${this.active}
        @click=${() => {
          if (this.parent) {
            const parent = this.parent;
            callAfterRender(() => {
              Globals.layout.highlight();
            });
            parent.switchTab(this.name.value);
          }
        }}
      >
        ${caption}
      </button>`,
    ];
  }

  highlight() {}

  /**
   * An opportunity to upgrade the format if needed
   * @param {any} obj
   * @returns {Object}
   */
  static upgrade(obj) {
    return obj;
  }

  configure() {}

  async onUpdate() {
    await this.doUpdate(true);
    this.configure();
  }

  async doUpdate(save = true) {
    const tableName = this.staticTableName;
    if (tableName) {
      const externalRep = this.toObject({ omittedProps: [], includeIds: true });
      await db.write(tableName, externalRep);
      if (save) this.changeStack.save(externalRep);
      Globals.state.update();
    }
  }

  async undo() {
    const tableName = this.staticTableName;
    if (tableName) {
      this.changeStack.undo(this);
      await this.doUpdate(false);
      Globals.designer.restoreFocus();
    }
  }

  async redo() {
    const tableName = this.staticTableName;
    if (tableName) {
      this.changeStack.redo(this);
      await this.doUpdate(false);
      Globals.designer.restoreFocus();
    }
  }

  /** @param {string[]} classes
   * @returns {string}
   */
  CSSClasses(...classes) {
    classes.push("DesignerPanel");
    if (this.active) {
      classes.push("ActivePanel");
    }
    return super.CSSClasses(...classes);
  }
}
