/* Thinking about better properties */

import { html } from "uhtml";
import { validateExpression, compileExpression } from "../eval";
import Globals from "../globals";

export class Prop {
  label = "My Label";
  hidden = false;
  placeholder = "";
  title = "";
  value;
  given = "";
  choices = {};
  container = null;
  eval(context) {
    return this.value;
  }
  input() {
    return html``;
  }
  set(value) {
    this.value = value;
  }
}

export class Select extends Prop {
  constructor(choices = [""], options = {}) {
    super();
    Object.assign(this, options);
    this.choices = choices;
    this.value = this.choices[0];
  }

  input() {
    return html`<label ?hiddenLabel=${this.hidden}>
      <span>${this.label}</span>
      <select
        title=${this.title}
        onchange=${(e) => {
          this.value = e.target.value;
        }}
      >
        ${this.choices.map(
          (option) =>
            html`<option value=${option} ?selected=${this.value == option}>
              ${option}
            </option>`
        )}
      </select></label
    >`;
  }
}

export class Field extends Select {
  constructor(options = {}) {
    const choices = [...Globals.data.allFields, "#componentName"].sort();
    super(choices, options);
  }
}

export class String extends Prop {
  constructor(value = "", options = {}) {
    super();
    Object.assign(this, options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.hidden}>
      <span>${this.label}</span>
      <input
        type="text"
        .value=${this.value}
        onchange=${(e) => {
          this.value = e.target.value;
        }}
        title=${this.title}
      />
    </label>`;
  }
}

export class Integer extends Prop {
  constructor(value = 0, options = {}) {
    super();
    Object.assign(this, options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.hidden}>
      <span>${this.label}</span>
      <input
        type="number"
        .value=${this.value}
        onchange=${(e) => {
          this.value = e.target.valueAsNumber;
        }}
        title=${this.title}
      />
    </label>`;
  }
}

export class Expression extends Prop {
  compiled = null;
  constructor(value = "", options = {}) {
    super();
    Object.assign(this, options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.hidden}>
      <span>${this.label}</span>
      <input
        type="text"
        .value=${this.value}
        onchange=${(e) => {
          this.value = e.target.value;
          this.compiled = compileExpression(this.value);
        }}
        title=${this.title}
      />
    </label>`;
  }

  set(value) {
    this.value = value;
    this.compiled = compileExpression(this.value);
  }

  eval(context) {
    return this.compiled(context);
  }
}
