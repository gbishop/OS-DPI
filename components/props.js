/* Thinking about better properties */

import { html } from "uhtml";
import css from "ustyler";
import { validateExpression, compileExpression } from "../eval";
import Globals from "../globals";

/**
 * @typedef {Object} PropOptions
 * @property {boolean} [hiddenLabel]
 * @property {string} [placeholder]
 * @property {string} [title]
 */

export class Prop {
  label = "My Label";
  value;

  /** @type {PropOptions} */
  options = {};

  /** @param {PropOptions} options */
  constructor(options = {}) {
    this.options = options;
  }
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
  /**
  @param {string[]} choices
  @param {Object} options
  */
  constructor(choices = [], options = {}) {
    super(options);
    this.choices = choices;
    this.value = choices[0];
  }

  input() {
    // console.log("choices", this.choices, this.value, this.options);
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <select
        title=${this.options.title}
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
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="text"
        .value=${this.value}
        onchange=${(e) => {
          this.value = e.target.value;
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />
    </label>`;
  }
}

export class Integer extends Prop {
  constructor(value = 0, options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="number"
        .value=${this.value}
        onchange=${(e) => {
          this.value = e.target.valueAsNumber;
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />
    </label>`;
  }
}

export class Expression extends Prop {
  compiled = null;
  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="text"
        .value=${this.value}
        onchange=${(e) => {
          this.value = e.target.value;
          this.compiled = compileExpression(this.value);
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />
    </label>`;
  }

  /** @param {string} value */
  set(value) {
    this.value = value;
    this.compiled = compileExpression(this.value);
  }

  /** @param {Object} context */
  eval(context) {
    if (this.compiled) {
      const r = this.compiled(context);
      return r;
    }
  }
}

css`
  label[hiddenLabel] span {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
`;
