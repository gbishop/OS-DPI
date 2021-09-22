import { html } from "uhtml";
import { hasTaggedRows } from "../data";
import { state } from "../state";
import ABase from "./a-base";

class AChoice extends ABase {
  text = "choose me";
  value = "";

  static observed = "value";

  get designerName() {
    return `${this.tagName} ${this.text}`;
  }
}
customElements.define("a-choice", AChoice);

class AChooseOne extends ABase {
  /** @type {"radio" | "select" | "toggle"} */
  kind = "radio";
  label = "";
  state = "";
  initial = "";
  background = "lightgray";
  selected = "pink";
  scale = 1;
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
    if (this.kind == "radio") {
      if (target instanceof HTMLButtonElement) {
        const value = target.value;
        const name = this.state;
        state.update({ [name]: value });
      }
    } else if (this.kind == "toggle") {
      if (target instanceof HTMLButtonElement) {
        const current = target.value;
        const validChoices = this.choices.filter((choice) =>
          this.valid(choice.value)
        );
        let index = validChoices.findIndex((choice) => choice.value == current);
        const N = validChoices.length;
        index = (((index + 1) % N) + N) % N;
        const value = validChoices[index].value;
        const name = this.state;
        state.update({ [name]: value });
      }
    }
  }

  template() {
    this.style.flexGrow = this.scale.toString();
    let chooser;
    if (this.kind === "radio") {
      let current = state(this.state);
      chooser = this.choices.map((choice) => {
        const value = choice.value || choice.text;
        const disabled = this.tags && !this.valid(value);
        const color = value == current ? this.selected : this.background;
        const style = `background-color: ${color}`;
        return html`<button value=${value} ?disabled=${disabled} style=${style}>
          ${choice.text}
        </button>`;
      });
    } else if (this.kind == "toggle") {
      const current = state(this.state);
      const validChoices = this.choices.filter((choice) =>
        this.valid(choice.value)
      );
      let index = validChoices.findIndex((choice) => choice.value == current);
      if (index < 0) {
        index = 0;
      }
      const choice =
        (validChoices.length && validChoices[index]) || this.choices[0];
      const value = choice.value;
      const color = value == current ? this.selected : this.background;
      const style = `background-color: ${color}`;
      chooser = html`<button
        value=${choice.value}
        ?disabled=${validChoices.length < 1}
        style=${style}
      >
        ${choice.text}
      </button>`;
    }
    return html`<fieldset>
      ${this.label && html`<legend>${this.label}</legend>`} ${chooser}
    </fieldset>`;
  }

  get designerChildren() {
    return this.choices;
  }
}

customElements.define("a-choose-one", AChooseOne);
