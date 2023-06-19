/** A menu object with these features:
 *  * Accessible
 *  * Dynamically update available items
 */

import { html } from "uhtml";
import "css/menu.css";
import Globals from "app/globals";
import { callAfterRender } from "app/render";

export class MenuItem {
  /**
   * @param {Object} obj - argument object
   * @param {string} obj.label
   * @param {Function | null} [ obj.callback ]
   * @param {any[]} [ obj.args ]
   * @param {string} [ obj.title ]
   * @param {string} [ obj.divider ]
   */
  constructor({ label, callback = null, args = [], title = "", divider = "" }) {
    this.label = label;
    this.callback = callback;
    this.args = args;
    this.title = title;
    this.divider = divider;
  }

  apply() {
    if (this.callback) this.callback(...this.args);
  }
}

export class Menu {
  // a unique id for each menu
  static _menuCount = 0;
  id = `menu_${Menu._menuCount++}`;

  // these are for aria references
  contentId = this.id + "_content";
  buttonId = this.id + "_button";

  expanded = false; // true when the menu is shown

  /** @type {MenuItem[]} */
  items = []; // cached items returned from the contentCallback

  /** @type {HTMLElement} - reference to the outer div */
  current;

  /**
   * @param {string} label - label on the menu button
   * @param {function(...any): MenuItem[]} contentCallback - returns the menu items to display
   * @param {any[]} callbackArgs - type
   */
  constructor(label, contentCallback, ...callbackArgs) {
    this.label = label;
    this.contentCallback = contentCallback;
    this.callbackArgs = callbackArgs;
  }

  render() {
    if (this.expanded) {
      this.items = this.contentCallback(...this.callbackArgs);
      if (this.items.length == 0) {
        this.items = [new MenuItem({ label: "None" })];
      }
    } else {
      this.items = [];
    }
    return html`<div
      class="Menu"
      id=${this.id}
      onfocusout=${this.focusHandler}
      ref=${this}
    >
      <button
        id=${this.buttonId}
        aria-expanded=${this.expanded}
        aria-controls=${this.contentId}
        aria-haspopup="true"
        onclick=${this.toggleExpanded}
        onkeyup=${this.buttonKeyHandler}
      >
        ${this.label}
      </button>
      <ul
        ?hidden=${!this.expanded}
        role="menu"
        id=${this.contentId}
        aria-labelledby=${this.buttonId}
        onkeyup=${this.menuKeyHandler}
      >
        ${this.items.map((item, index) => {
          return html`<li role="menuitem" divider=${item.divider}>
            <button
              index=${index}
              aria-disabled=${!item.callback}
              title=${item.title}
              onclick=${() => {
                if (item.callback) {
                  this.toggleExpanded();
                  item.apply();
                }
              }}
            >
              ${item.label}
            </button>
          </li>`;
        })}
      </ul>
    </div>`;
  }

  /** @returns {HTMLButtonElement | null} */
  get focusedItem() {
    return this.current.querySelector("li > button:focus");
  }

  /** @param {number} index */
  setFocus(index) {
    // make it a circular buffer
    if (!this.items.length) return;
    index = (index + this.items.length) % this.items.length;
    const item = /** @type {HTMLElement} */ (
      this.current.querySelector(`button[index="${index}"]`)
    );
    if (item) item.focus();
  }

  /* Close the menu when it loses focus */
  focusHandler = ({ relatedTarget }) => {
    if (!relatedTarget) {
      // focus is gone, put it back on the button
      callAfterRender(() => {
        const button = document.getElementById(this.buttonId);
        if (button) button.focus();
      });
      if (this.expanded) this.toggleExpanded();
      return;
    }
    const menu = document.getElementById(this.id);
    if (menu && !menu.contains(relatedTarget) && this.expanded) {
      this.toggleExpanded();
    }
  };

  /* Toggle the menu state */
  toggleExpanded = (event = null, last = false) => {
    {
      this.expanded = !this.expanded;
      // this trick lets us distinguish between clicking the menu button with the mouse
      // and hitting Enter on the keyboard
      const mouseClick = event && event["detail"] !== 0;
      if (this.expanded && (!event || !mouseClick)) {
        // focus on the first element when expanding via keyboard
        callAfterRender(() => {
          if (last) {
            this.setFocus(-1);
          } else {
            this.setFocus(0);
          }
        });
      } else if (!this.expanded && mouseClick) {
        callAfterRender(() => Globals.designer.restoreFocus());
      }
      Globals.state.update();
    }
  };

  /** handle the keyboard when inside the menu
   *
   * @param {KeyboardEvent} event
   * */
  menuKeyHandler = ({ key }) => {
    if (key == "Escape" && this.expanded) {
      this.toggleExpanded();
    } else if (key == "ArrowUp" || key == "ArrowDown") {
      const focused = this.focusedItem;
      const index = +(focused?.getAttribute("index") || 0);
      const step = key == "ArrowUp" ? -1 : 1;
      this.setFocus(index + step);
    } else if (key == "Home") {
      this.setFocus(0);
    } else if (key == "End") {
      this.setFocus(-1);
    } else if (
      key.length == 1 &&
      ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z"))
    ) {
      const focused = this.focusedItem;
      const index = +(focused?.getAttribute("index") || 0);
      for (let i = 1; i < this.items.length; i++) {
        if (
          this.items[(index + i) % this.items.length].label
            .toLowerCase()
            .startsWith(key)
        ) {
          this.setFocus(i + index);
          break;
        }
      }
    }
  };

  /**
   * Handle the keyboard when on the menu button
   *
   * @param {KeyboardEvent} event */
  buttonKeyHandler = (event) => {
    if (event.key == "ArrowDown" || event.key == " ") {
      event.preventDefault();
      this.toggleExpanded();
    } else if (event.key == "ArrowUp") {
      event.preventDefault();
      this.toggleExpanded(null, true);
    }
  };
}
