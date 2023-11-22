/**
 * Wrap the W3C Actions Menu Button Example Using element.focus()
 * to make it work as a Web Component and then add a helper to
 * generate the HTML.
 *
 * Gary Bishop 2022
 */

import { MenuButtonActions } from "./menu-button-action";
import { html, render } from "uhtml";
import css from "ustyler";

/* Create a Web Component encapsulating the W3C example */
export class MenuButton extends HTMLElement {
  connectedCallback() {
    console.log("ccb", this);
    this.w3cmenu = new MenuButtonActions(
      this.querySelector("div.menu-button-actions"),
      /** @param {HTMLElement} target */
      (target) => {
        console.log({ target });
        this.dispatchEvent(new CustomEvent("MenuSelect", { detail: target }));
      }
    );
  }
}
customElements.define("menu-button", MenuButton);

/* experiment with doing it all in the component.
 * I don't like this.
 */
export class MenuButton2 extends HTMLElement {
  /** @type {MenuItem[]} */
  choices = [];
  buttonId = nextId();
  menuId = nextId();

  connectedCallback() {
    console.log("ccb2", this);
    this.update();
    this.w3cmenu = new MenuButtonActions(
      this.querySelector("div.menu-button-actions"),
      /** @param {HTMLElement} target */
      (target) => {
        console.log({ target });
        this.dispatchEvent(new CustomEvent("MenuSelect", { detail: target }));
      }
    );
  }

  update() {
    render(
      this,
      html` <div class="menu-button-actions">
        <button
          type="button"
          id=${this.buttonId}
          aria-haspopup="true"
          aria-controls=${this.menuId}
        >
          ${this.getAttribute("label")}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="down"
            width="12"
            height="9"
            viewBox="0 0 12 9"
          >
            <polygon points="1 0, 11 0, 6 8"></polygon>
          </svg>
        </button>
        <ul id=${this.menuId} role="menu" aria-labelledby=${this.buttonId}>
          ${this.choices.map(
            (choice, index) =>
              html`<li
                data-index=${index}
                role="menuitem"
                aria=${{ disabled: !!choice.disabled }}
              >
                ${choice.label}
              </li>`
          )}
        </ul>
      </div>`
    );
  }
}
customElements.define("menu-button2", MenuButton2);

let idNumber = 0;
function nextId(prefix = "id") {
  idNumber += 1;
  return `w3c-menu-button-actions-${prefix}-${idNumber}`;
}

/**
 * @typedef {Object} MenuItem
 * @property {string} label
 * @property {boolean} [disabled]
 */
export class Menu {
  /**
   * @param {string} label
   * @param {MenuItem[]} choices
   * @param {(item: MenuItem)=>void} handler
   */
  constructor(label, choices, handler = null) {
    this.label = label;
    this.choices = choices;
    this.handler = handler;
    this.buttonId = nextId("button");
    this.menuId = nextId("menu");
  }

  render() {
    const foo = "foo";
    return html`<menu-button
      .foo=${foo}
      onMenuSelect=${(event) => {
        const target = event.detail;
        console.log(target, target.ariaDisabled);
        if (target.ariaDisabled != "true") {
          this.handler(this.choices[+target.dataset.index]);
        }
      }}
    >
      <div class="menu-button-actions">
        <button
          type="button"
          id=${this.buttonId}
          aria-haspopup="true"
          aria-controls=${this.menuId}
        >
          ${this.label}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="down"
            width="12"
            height="9"
            viewBox="0 0 12 9"
          >
            <polygon points="1 0, 11 0, 6 8"></polygon>
          </svg>
        </button>
        <ul id=${this.menuId} role="menu" aria-labelledby=${this.buttonId}>
          ${this.choices.map(
            (choice, index) =>
              html`<li
                data-index=${index}
                role="menuitem"
                aria=${{ disabled: !!choice.disabled }}
              >
                ${choice.label}
              </li>`
          )}
        </ul>
      </div></menu-button
    >`;
  }
}

/**
 * Render a menu button
 * @param {string} label - label for the button
 * @param {string[]} choices - choices for the menu
 * */
export function menu(label, choices) {
  const buttonId = nextId("button");
  const menuId = nextId("menu");

  return html`<menu-button>
    <div class="menu-button-actions">
      <button
        type="button"
        id=${buttonId}
        aria-haspopup="true"
        aria-controls=${menuId}
      >
        ${label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="down"
          width="12"
          height="9"
          viewBox="0 0 12 9"
        >
          <polygon points="1 0, 11 0, 6 8"></polygon>
        </svg>
      </button>
      <ul id=${menuId} role="menu" aria-labelledby=${buttonId}>
        ${choices.map((choice) => html`<li role="menuitem">${choice}</li>`)}
      </ul>
    </div></menu-button
  >`;
}

css`
  .treebase menu-button {
    display: inline-block;
    float: right;
  }

  .menu-button-actions {
    margin: 0;
    padding: 0;
  }

  .treebase .menu-button-actions button {
    margin: 0;
    padding: 6px;
    display: inline-block;
    position: relative;
    background-color: #034575;
    border: 1px solid #034575;
    font-size: 0.9em;
    color: white;
    border-radius: 5px;
  }

  .menu-button-actions [role="menu"] {
    display: none;
    position: absolute;
    margin: 0;
    padding: 7px 4px;
    border: 2px solid #034575;
    border-radius: 5px;
    background-color: #eee;
    z-index: 10;
    right: 0px;
  }

  .menu-button-actions [role="menuitem"],
  .menu-button-actions [role="separator"] {
    margin: 0;
    padding: 6px;
    display: block;
    width: 4em;
    background-color: #eee;
    color: black;
    border-radius: 5px;
  }

  .menu-button-actions [role="menuitem"][aria-disabled="true"] {
    text-decoration: line-through;
  }

  .menu-button-actions [role="separator"] {
    padding-top: 3px;
    background-image: url("../images/separator.svg");
    background-position: center;
    background-repeat: repeat-x;
  }

  .menu-button-actions button svg.down {
    padding-left: 0.125em;
    fill: currentcolor;
    stroke: currentcolor;
  }

  .menu-button-actions button[aria-expanded="true"] svg.down {
    transform: rotate(180deg);
  }

  /* focus styling */

  .menu-button-actions button:hover,
  .menu-button-actions button:focus,
  .menu-button-actions button[aria-expanded="true"] {
    padding: 4px;
    border: 3px solid #034575;
    background: #eee;
    color: #222;
    outline: none;
    margin: 0;
  }

  .menu-button-actions [role="menuitem"].focus,
  .menu-button-actions [role="menuitem"]:focus {
    padding: 4px;
    border: 2px solid #034575;
    background: #034575;
    color: #fff;
    outline: none;
    margin: 0;
  }
`;
