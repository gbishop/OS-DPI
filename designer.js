import { html, render } from "uhtml";
import ABase from "./components/a-base";
import { state } from "./state";
import ATabControl from "./components/a-tab-control";

export class Designer {
  /** @param {ABase} element
   * @param {Designer|null} parent */
  constructor(element, parent) {
    /** @type {ABase} */
    this.element = element;
    this.parent = parent;
    this.open = false;
    this.editing = false;
    this.highlight = false;
    /** @type {Designer[]} */
    this.children = [];
    if (this.element instanceof ATabControl) {
      state.observe(updateDesigner, this.element.state);
    }
  }

  /** @param {string} name
   * @param {any} value */
  toggle(name, value) {
    if (typeof value === "undefined") {
      value = !this[name];
    }
    if (this[name] != value) {
      this[name] = value;
      updateDesigner();
    }
  }

  render() {
    /** @param {PointerEvent} ev */
    function click(ev) {
      console.log("click", ev);
      if (ev.target instanceof HTMLButtonElement) {
        ev.preventDefault();
      }
      ev.stopPropagation();
    }
    const focusin = (ev) => {
      ev.stopPropagation();
      this.element.setHighlight(true);
      this.toggle("highlight", true);
      updateDesigner();
    };
    const focusout = () => {
      this.element.style.border = "";
      this.element.setHighlight(false);
      this.toggle("highlight", false);
    };
    const setOpen = (ev) => {
      const o = ev.target.hasAttribute("open");
      this.element.makeVisible(o);
      this.toggle("open", o);
      this.toggle("highlight", o);
    };
    if (this.children.length) {
      const cls = this.highlight ? "highlight" : "";
      return html`<details
          class=${cls}
          onfocusin=${focusin}
          onfocusout=${focusout}
          onclick=${click}
          ?open=${this.open}
          ontoggle=${(ev) => setOpen(ev)}
        >
          <summary>
            ${this.element.getName()}
            <button
              class="edit"
              onclick=${() => {
                this.toggle("editing");
              }}
            ></button>
          </summary>
          ${(this.open && this.editing && this.renderControls()) || null}
          <ul>
            ${this.children.map((child) => html`<li>${child.render()}</li>`)}
          </ul>
        </details>
        ${(!this.open && this.editing && this.renderControls()) || null}`;
    } else {
      return html` <button
          class="edit"
          onfocusin=${focusin}
          onfocusout=${focusout}
          onclick=${() => {
            this.toggle("editing");
            this.toggle("open", true);
          }}
        >
          ${this.element.getName()}
        </button>
        ${(this.editing && this.renderControls()) || null}`;
    }
  }

  renderControls() {
    function propControl(element, name) {
      let type = "text";
      let value = element[name];
      // this is a hack, we need types
      if (name === "background") {
        type = "color";
      } else if (typeof element[name] === "number" || name == "scale") {
        type = "number";
      }
      const id = `${element.id}-${name}`;
      const control =
        type == "color"
          ? html`<color-input
              id=${id}
              value=${value}
              onchange=${(event) => propUpdate(element, name, event)}
            />`
          : html`<input
              id=${id}
              type=${type}
              value=${value}
              onchange=${(event) => propUpdate(element, name, event)}
            />`;
      return { name, control, id };
    }

    function propUpdate(element, name, event) {
      let value = event.target.value;
      if (typeof element[name] === "number") {
        value = parseInt(value);
        if (isNaN(value)) value = 0;
      }
      element[name] = value;
      element.render();
      updateDesigner();
    }

    if (this.element instanceof ABase) {
      const controls = this.element.props.map((name) =>
        propControl(this.element, name)
      );
      return html`<div class="controls">
        <table>
          <tbody>
            ${controls.map(
              ({ name, control, id }) =>
                html`<tr>
                  <td><label for=${id}>${name}</label></td>
                  <td>${control}</td>
                </tr>`
            )}
          </tbody>
        </table>
      </div>`;
    }
  }
}

let Root = [];

/** @param {ABase} element */
function buildDesigner(element, parent = null) {
  /** @type {Designer} */
  let result;

  result = new Designer(element, parent);

  result.children = result.element
    .getChildren()
    .map((child) => buildDesigner(child, parent));
  return result;
}

export function initDesigner() {
  const UI = document.querySelector("div#UI");
  Root = [...UI.children].map((child) =>
    buildDesigner(/** @type {ABase} */ (child))
  );
  updateDesigner();
}

export function updateDesigner() {
  console.log("update");
  render(
    document.querySelector("div#designer"),
    html`${Root.map((d) => d.render())}`
  );
}
