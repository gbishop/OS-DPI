/** A menu object with these features:
 *  * Accessible
 *  * Dynamically update available items
 */

import { html } from "uhtml";
import css from "ustyler";
import Globals from "../globals";
import { callAfterRender } from "../render";

/**
 * @typedef {Object} MenuItem
 * @property {string} label
 * @property {function} callback
 */

export class Menu {
  static _menuCount = 0;
  id = `menu_${Menu._menuCount++}`;
  contentId = this.id + "_content";
  buttonId = this.id + "_button";

  expanded = false;

  /** @type {MenuItem[]} */
  items = []; // cached items returned from the contentCallback

  /** @type {HTMLElement} - reference to the outer div */
  current = null;

  /** @param {string} label - label on the menu button
   * @param {function(): MenuItem[]} contentCallback - returns the menu items to display
   */
  constructor(label, contentCallback) {
    this.label = label;
    this.contentCallback = contentCallback;
  }

  render() {
    if (this.expanded) {
      this.items = this.contentCallback();
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
        ${this.items.map(
          (item, index) =>
            html`<li role="menuitem">
              <button
                index=${index}
                onclick=${() => {
                  this.toggleExpanded();
                  item.callback();
                }}
              >
                ${item.label}
              </button>
            </li>`
        )}
      </ul>
    </div>`;
  }

  /** @returns {HTMLButtonElement} */
  get focusedItem() {
    return this.current.querySelector("li > button:focus");
  }

  /** @param {number} index */
  setFocus(index) {
    index = (index + this.items.length) % this.items.length;
    const item = /** @type {HTMLElement} */ (
      this.current.querySelector(`button[index="${index}"]`)
    );
    item.focus();
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
      const mouseClick = event && event.detail !== 0;
      if (this.expanded && (!event || !mouseClick)) {
        // focus on the first element when expanding via keyboard
        callAfterRender(() => {
          if (last) {
            this.setFocus(-1);
          } else {
            this.setFocus(0);
          }
        });
      }
      Globals.state.update();
    }
  };

  menuKeyHandler = ({ key }) => {
    if (key == "Escape" && this.expanded) {
      this.toggleExpanded();
    } else if (key == "ArrowUp" || key == "ArrowDown") {
      const focused = this.focusedItem;
      const index = +focused.getAttribute("index");
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
      const index = +focused.getAttribute("index");
      for (let i = 1; i < this.items.length; i++) {
        if (this.items[(index + i) % this.items.length].label.startsWith(key)) {
          this.setFocus(i + index);
          break;
        }
      }
    }
  };

  /** @param {KeyboardEvent} event */
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

css`
  .Menu {
    display: inline-block;
  }
  .Menu [hidden] {
    display: none;
  }
  .Menu > button {
    display: inline-block;
    position: relative;
  }
  .Menu ul {
    display: flex;
    flex-direction: column;
    position: absolute;
    margin: 0;
    padding: 7px 4px;
    border: 2px solid 0x034575;
    border-radius: 5px;
    background-color: #eee;
  }
  .Menu li {
    margin: 0;
    padding: 6px;
    display: flex;
    background-color: #eee;
    color: black;
    border-radius: 5px;
  }
  .Menu li button {
    flex: 1;
  }
  .Menu li button:hover {
    outline: 2px solid orange;
  }
`;
