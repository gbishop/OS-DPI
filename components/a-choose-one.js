import { html } from "uhtml";
import { hasTaggedRows } from "../data";
import { state } from "../state";
import ABase from "./a-base";

class AChoice extends ABase {
  text = "choose me";
  value = "";

  static observed = "value";

  init() {
    this.disabled = false;
    this.color = "";
    if (!this.value.length) {
      this.value = this.text;
    }
    /** @type {AChooseOne} */
    this.parent = this.closest("a-choose-one");
    state.observe(this, this.parent.state);
  }

  get designerName() {
    return `${this.tagName} ${this.text}`;
  }

  template() {
    console.log("draw choice", this.text, this.color);
    const style = this.getStyleString({ backgroundColor: this.color });
    return html`<button
      value=${this.value || this.text}
      ?disabled=${this.disabled}
      style=${style}
    >
      ${this.text}
    </button>`;
  }
}
customElements.define("a-choice", AChoice);

export default class AChooseOne extends ABase {
  label = "";
  state = "";
  initial = "";
  background = "lightgray";
  selected = "pink";
  scale = "1";
  tags = "";

  static observed = "kind label state initial background selected scale tags";

  init() {
    state.define(this.state, this.initial);
    state.observe(this, this.state);
    // gather the choices
    /** @type {AChoice[]} */
    this.choices = Array.from(this.querySelectorAll("a-choice"));
    this.addEventListener("click", (e) => this.handleClick(e));
  }
  /**
   * true if there exist rows with the this.tags and the value
   * @arg {string} value
   * @returns {boolean}
   */
  valid(value) {
    return hasTaggedRows(`${this.tags} ${value}`);
  }

  /**
   * handle clicks on the chooser
   * @param {MouseEvent} event
   */
  handleClick({ target }) {
    if (target instanceof HTMLButtonElement) {
      const value = target.value;
      const name = this.state;
      state.update({ [name]: value });
    }
  }

  template() {
    this.setStyle({ flexGrow: this.scale });
    const current = state(this.state);
    this.choices.forEach((choice) => {
      if (this.tags && !this.valid(choice.value)) {
        choice.setAttribute("disabled", "disabled");
      }
      const color = choice.value == current ? this.selected : this.background;
      choice.setStyle({ backgroundColor: color });
      console.log("choice", choice);
    });

    return html`<fieldset>
      ${(this.label && html`<legend>${this.label}</legend>`) || null}
      ${this.choices}
    </fieldset>`;
  }

  getChildren() {
    return this.choices;
  }
}

customElements.define("a-choose-one", AChooseOne);
