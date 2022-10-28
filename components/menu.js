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

  /** @param {string} label - label on the menu button
   * @param {function(): MenuItem[]} contentCallback - returns the menu items to display
   */
  constructor(label, contentCallback) {
    this.label = label;
    this.contentCallback = contentCallback;

    /* Close the menu when it loses focus */
    this.checkFocusOut = ({ relatedTarget }) => {
      console.log("checkFocusOut", relatedTarget, this.expanded);
      if (!relatedTarget) {
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
    this.toggleExpanded = (event = null) => {
      {
        this.expanded = !this.expanded;
        if (this.expanded && event && event.detail === 0) {
          // focus on the first element when expanding via keyboard
          callAfterRender(() => {
            const ul = document.getElementById(this.contentId);
            const first = ul.querySelector("button");
            first.focus();
          });
        }
        Globals.state.update();
      }
    };

    this.keyHandler = ({ key }) => {
      if (key == "Escape") this.toggleExpanded();
      else if (key == "ArrowUp" || key == "ArrowDown") {
        const menu = document.getElementById(this.contentId);
        const items = [...menu.querySelectorAll("button")];
        const current = /** @type {HTMLButtonElement} */ (
          menu.querySelector("button:focus")
        );
        if (current) {
          const index = items.indexOf(current);
          const step = key == "ArrowUp" ? -1 : 1;
          const count = items.length;
          const next = (index + step + count) % count;
          items[next].focus();
        }
      }
    };
  }

  render() {
    let items = [];
    if (this.expanded) {
      items = this.contentCallback();
      console.log({ items });
    }
    return html`<div
      class="Menu"
      id=${this.id}
      onkeyup=${this.keyHandler}
      onfocusout=${this.checkFocusOut}
    >
      <button
        id=${this.buttonId}
        aria-expanded=${this.expanded}
        aria-controls=${this.contentId}
        aria-haspopup="true"
        onclick=${this.toggleExpanded}
      >
        ${this.label}
      </button>
      <ul
        ?hidden=${!this.expanded}
        role="menu"
        id=${this.contentId}
        aria-labelledby=${this.buttonId}
      >
        ${items.map(
          (item) =>
            html`<li role="menuitem">
              <button
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
