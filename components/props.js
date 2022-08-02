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
 * @property {string} [label]
 * @property {boolean} [multiple]
 */

export class Prop {
  label = "";
  /** @type {string} */
  value;

  get valueAsNumber() {
    return parseFloat(this.value);
  }

  /** @type {PropOptions} */
  options = {};

  /** @param {PropOptions} options */
  constructor(options = {}) {
    this.options = options;
    if ("label" in options) {
      this.label = options.label;
    }
  }
  /** @param {Object} _ - The context */
  eval(_) {
    return this.value;
  }
  input() {
    return html``;
  }
  /** @param {any} value */
  set(value) {
    this.value = value;
  }
}

/** @param {string[] | Map<string,string>} arrayOrMap
 * @returns Map<string, string>
 */
function toMap(arrayOrMap) {
  if (Array.isArray(arrayOrMap)) {
    const r = new Map();
    for (const item of arrayOrMap) {
      r.set(item, item);
    }
    return r;
  }
  return arrayOrMap;
}

export class Select extends Prop {
  /**
   * @param {string[] | Map<string, string>} choices
   * @param {PropOptions} options
   */
  constructor(choices = [], options = {}) {
    super(options);
    /** @type {Map<string, string>} */
    this.choices = toMap(choices);
  }

  input(choices = null) {
    if (!choices) {
      choices = this.choices;
    }
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <select
        title=${this.options.title}
        onchange=${({ target }) => {
          this.value = target.value;
        }}
      >
        ${[...choices.entries()].map(
          ([key, value]) =>
            html`<option value=${key} ?selected=${this.value == key}>
              ${value}
            </option>`
        )}
      </select></label
    >`;
  }

  /** @param {any} value */
  set(value) {
    if (!Array.isArray(value)) {
      value = [value];
    }
    this.values = value.filter((v) => this.choices.has(v));
    this.value = this.values[0];
  }
}

export class Field extends Select {
  constructor(options = {}) {
    const choices = [...Globals.data.allFields, "#componentName"].sort();
    super(choices, options);
  }
}

export class String extends Prop {
  value = "";

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
        onchange=${({ target }) => {
          this.value = target.value;
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
    this.value = value.toString();
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="number"
        .value=${this.value}
        onchange=${({ target }) => {
          this.value = target.value;
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />
    </label>`;
  }
}

export class Float extends Prop {
  constructor(value = 0, options = {}) {
    super(options);
    this.value = value.toString();
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="number"
        .value=${this.value}
        onchange=${({ target }) => {
          this.value = target.value;
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
        step="any"
      />
    </label>`;
  }
}

export class Boolean extends Prop {
  constructor(value = false, options = {}) {
    super(options);
    this.value = value.toString();
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="checkbox"
        ?checked=${this.value == "true"}
        onchange=${({ target }) => {
          this.value = target.checked ? "true" : "false";
        }}
        title=${this.options.title}
      />
    </label>`;
  }
}

export class UID extends Prop {
  constructor() {
    super({});
    this.value =
      "id" + Date.now().toString(36) + Math.random().toString(36).slice(2);
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
        onchange=${({ target }) => {
          this.value = target.value;
          this.compiled = compileExpression(this.value);
          console.log("compiled", this.compiled);
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
