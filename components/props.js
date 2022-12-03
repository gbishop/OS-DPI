/* Thinking about better properties */

import { html } from "uhtml";
import "css/props.css";
import { compileExpression } from "app/eval";
import Globals from "app/globals";

/**
 * @typedef {Object} PropOptions
 * @property {boolean} [hiddenLabel]
 * @property {string} [placeholder]
 * @property {string} [title]
 * @property {string} [label]
 * @property {boolean} [multiple]
 * @property {string} [defaultValue]
 */

export class Prop {
  label = "";
  /** @type {any} */
  value;

  // Each prop gets a unique id based on the id of its container
  id = "";

  /** @type {import('./treebase').TreeBase} */
  container = null;

  /** attach the prop to its containing TreeBase component
   * @param {string} name
   * @param {any} value
   * @param {TreeBase} container
   * */
  initialize(name, value, container) {
    // create id from the container id
    this.id = `${container.id}-${name}`;
    // link to the container
    this.container = container;
    // set the value if provided
    if (value != null) {
      this.set(value);
    }
    // create a label if it has none
    this.label =
      this.label ||
      name // convert from camelCase to Camel Case
        .replace(/(?!^)([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase());
  }

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
  eval(_ = {}) {
    return this.value;
  }
  input() {
    return html`<!--empty-->`;
  }
  /** @param {any} value */
  set(value) {
    this.value = value;
  }

  update() {
    this.container.update();
  }
}

/** @param {string[] | Map<string,string>} arrayOrMap
 * @returns Map<string, string>
 */
function toMap(arrayOrMap) {
  if (Array.isArray(arrayOrMap)) {
    return new Map(arrayOrMap.map((item) => [item, item]));
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
    this.value = "";
  }

  /** @param {Map<string,string>} choices */
  input(choices = null) {
    if (!choices) {
      choices = this.choices;
    }
    this.value = this.value || this.options.defaultValue || "";
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <select
        id=${this.id}
        required
        title=${this.options.title}
        onchange=${({ target }) => {
          this.value = target.value;
          console.log("select", this, this.value, target.value);
          this.update();
        }}
      >
        <option value="" disabled ?selected=${!choices.has(this.value)}>
          ${this.options.placeholder || "Choose one..."}
        </option>
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
    this.value = value;
  }
}

export class Field extends Select {
  input(choices = null) {
    if (!choices) {
      choices = toMap([...Globals.data.allFields, "#ComponentName"].sort());
    }
    return super.input(choices);
  }
}

export class State extends Select {
  input(choices = null) {
    if (!choices) {
      choices = toMap([...Globals.tree.allStates()]);
    }
    return super.input(choices);
  }
}

export class TypeSelect extends Select {
  /** @type {import('./treebase').TreeBaseSwitchable} */
  container = null;

  update() {
    /* Magic happens here! The replace method on a TreeBaseSwitchable replaces the
     * node with a new one to allow type switching in place
     * */
    this.container.replace(this.value);
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
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.value;
          this.update();
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />
    </label>`;
  }
}

export class Integer extends Prop {
  /** @type {number} */
  value = 0;
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
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.value;
          this.update();
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />
    </label>`;
  }
}

export class Float extends Prop {
  /** @type {number} */
  value = 0;
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
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.value;
          this.update();
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
        step="any"
      />
    </label>`;
  }
}

export class Boolean extends Prop {
  /** @type {boolean} */
  value = false;

  constructor(value = false, options = {}) {
    super(options);
    this.value = value;
  }

  input(options = {}) {
    options = { ...this.options, ...options };
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <input
        type="checkbox"
        ?checked=${this.value}
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.checked;
          this.update();
        }}
        title=${this.options.title}
      />
    </label>`;
  }

  /** @param {any} value */
  set(value) {
    if (typeof value === "boolean") {
      this.value = value;
    } else if (typeof value === "string") {
      this.value = value === "true";
    }
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
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.value;
          this.compiled = compileExpression(this.value);
          console.log("compiled", this.compiled);
          this.update();
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

export class TextArea extends Prop {
  value = "";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return html`<label
      ?hiddenLabel=${this.options.hiddenLabel}
      style="width:100%"
    >
      <span>${this.label}</span>
      <textarea
        type="text"
        .value=${this.value}
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.value;
          this.update();
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      ></textarea>
    </label>`;
  }
}

export class Color extends Prop {
  value = "#ffffff";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <color-input
        .value=${this.value}
        id=${this.id}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          this.value = event.target.value;
          this.update();
        }}
      />
    </label>`;
  }
}

export class Voice extends Prop {
  value = "";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return html`<label ?hiddenLabel=${this.options.hiddenLabel}>
      <span>${this.label}</span>
      <select
        is="select-voice"
        .value=${this.value}
        id=${this.id}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          this.value = event.target.value;
          this.update();
        }}
      >
        <option value="">Default</option>
      </select></label
    >`;
  }
}
