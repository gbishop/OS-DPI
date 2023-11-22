/* Thinking about better properties */

import { html } from "uhtml";
import "css/props.css";
import { compileExpression } from "app/eval";
import Globals from "app/globals";
import { TreeBaseSwitchable } from "./treebase";

/**
 * @typedef {Object} PropOptions
 * @property {boolean} [hiddenLabel]
 * @property {string} [placeholder]
 * @property {string} [title]
 * @property {string} [label]
 * @property {boolean} [multiple]
 * @property {string} [defaultValue]
 * @property {string} [group]
 * @property {string} [language]
 * @property {Object<string,string>} [replacements]
 * @property {any} [valueWhenEmpty]
 * @property {string} [pattern]
 * @property {function(string):string} [validate]
 */

export class Prop {
  label = "";
  /** @type {any} */
  value;

  // Each prop gets a unique id based on the id of its container
  id = "";

  /** @type {import('./treebase').TreeBase} */
  container;

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
    if (options["label"]) {
      this.label = options["label"];
    }
  }
  /** @param {Object} _ - The context */
  eval(_ = {}) {
    return this.value;
  }
  input() {
    return html`<!--empty-->`;
  }
  /** @param {Hole} body */
  labeled(body) {
    return html`<div class="labeledInput">
      <label ?hiddenLabel=${this.options.hiddenLabel} for=${this.id}
        >${this.label}</label
      >
      ${body}
    </div>`;
  }

  /** @param {any} value */
  set(value) {
    this.value = value;
  }

  update() {
    this.container.update();
  }
}

/** @param {string[] | Map<string,string> | function():Map<string,string>} arrayOrMap
 * @returns Map<string, string>
 */
export function toMap(arrayOrMap) {
  if (arrayOrMap instanceof Function) {
    return arrayOrMap();
  }
  if (Array.isArray(arrayOrMap)) {
    return new Map(arrayOrMap.map((item) => [item, item]));
  }
  return arrayOrMap;
}

export class Select extends Prop {
  /**
   * @param {string[] | Map<string, string> | function():Map<string,string>} choices
   * @param {PropOptions} options
   */
  constructor(choices = [], options = {}) {
    super(options);
    this.choices = choices;
    this.value = "";
  }

  /** @param {Map<string,string> | null} choices */
  input(choices = null) {
    if (!choices) {
      choices = toMap(this.choices);
    }
    this.value = this.value || this.options.defaultValue || "";
    return this.labeled(
      html`<select
        id=${this.id}
        required
        title=${this.options.title}
        onchange=${({ target }) => {
          this.value = target.value;
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
            </option>`,
        )}
      </select>`,
    );
  }

  /** @param {any} value */
  set(value) {
    this.value = value;
  }
}

export class Field extends Select {
  /**
   * @param {PropOptions} options
   */
  constructor(options = {}) {
    super(
      () => toMap([...Globals.data.allFields, "#ComponentName"].sort()),
      options,
    );
  }
}

export class State extends Select {
  /**
   * @param {PropOptions} options
   */
  constructor(options = {}) {
    super(() => toMap([...Globals.tree.allStates()]), options);
  }
}

export class Cue extends Select {
  /**
   * @param {PropOptions} options
   */
  constructor(options = {}) {
    super(() => Globals.cues.cueMap, options);
  }
}

export class Pattern extends Select {
  /**
   * @param {PropOptions} options
   */
  constructor(options = {}) {
    super(() => Globals.patterns.patternMap, options);
  }
}

export class TypeSelect extends Select {
  update() {
    /* Magic happens here! The replace method on a TreeBaseSwitchable replaces the
     * node with a new one to allow type switching in place
     * */
    if (this.container instanceof TreeBaseSwitchable)
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
    return this.labeled(
      html`<input
        type="text"
        .value=${this.value}
        id=${this.id}
        pattern=${this.options.pattern}
        onchange=${({ target }) => {
          if (target.checkValidity()) {
            this.value = target.value;
            this.update();
          }
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />`,
    );
  }
}

/* Allow entering a key name by first pressing Enter than pressing a single key
 */
export class KeyName extends Prop {
  value = "";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    /** @param {string} key */
    function mapKey(key) {
      if (key == " ") return "Space";
      return key;
    }
    return this.labeled(
      html`<input
        type="text"
        .value=${mapKey(this.value)}
        id=${this.id}
        readonly
        onkeydown=${(/** @type {KeyboardEvent} */ event) => {
          const target = event.target;
          if (!(target instanceof HTMLInputElement)) return;
          if (target.hasAttribute("readonly") && event.key == "Enter") {
            target.removeAttribute("readonly");
            target.select();
          } else if (!target.hasAttribute("readonly")) {
            event.stopPropagation();
            event.preventDefault();
            this.value = event.key;
            target.value = mapKey(event.key);
            target.setAttribute("readonly", "");
          }
        }}
        title="Press Enter to change then press a single key to set"
        placeholder=${this.options.placeholder}
      />`,
    );
  }
}

export class TextArea extends Prop {
  value = "";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
    this.validate = this.options.validate || ((_) => "");
  }

  input() {
    return this.labeled(
      html`<textarea
        .value=${this.value}
        id=${this.id}
        ?invalid=${!!this.validate(this.value)}
        oninput=${({ target }) => {
          const errorMsg = this.validate(target.value);
          target.setCustomValidity(errorMsg);
        }}
        onchange=${({ target }) => {
          if (target.checkValidity()) {
            this.value = target.value;
            this.update();
          }
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />`,
    );
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
    return this.labeled(
      html`<input
        type="text"
        inputmode="numeric"
        pattern="[0-9]+"
        .value=${this.value}
        id=${this.id}
        onchange=${({ target }) => {
          if (target.checkValidity()) {
            this.value = parseInt(target.value);
            this.update();
          }
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />`,
    );
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
    return this.labeled(
      html`<input
        type="text"
        inputmode="numeric"
        pattern="[0-9]*([,.][0-9]*)?"
        .value=${this.value}
        id=${this.id}
        onchange=${({ target }) => {
          if (target.checkValidity()) {
            this.value = parseFloat(target.value);
            this.update();
          }
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
        step="any"
      />`,
    );
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
    return this.labeled(
      html`<input
        type="checkbox"
        ?checked=${this.value}
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.checked;
          this.update();
        }}
        title=${options.title}
      />`,
    );
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

export class OneOfGroup extends Prop {
  /** @type {boolean} */
  value = false;

  constructor(value = false, options = {}) {
    super(options);
    this.value = value;
  }

  input(options = {}) {
    options = { ...this.options, ...options };
    return this.labeled(
      html`<input
        type="checkbox"
        .checked=${!!this.value}
        id=${this.id}
        name=${options.group}
        onclick=${() => {
          this.value = true;
          this.clearPeers(options.group);
          this.update();
        }}
        title=${this.options.title}
      />`,
    );
  }

  /** @param {any} value */
  set(value) {
    if (typeof value === "boolean") {
      this.value = value;
    } else if (typeof value === "string") {
      this.value = value === "true";
    }
  }

  /**
   * Clear the value of peer radio buttons with the same name
   * @param {string} name
   */
  clearPeers(name) {
    const peers = this.container?.parent?.children || [];
    for (const peer of peers) {
      const props = peer.propsAsProps;
      for (const propName in props) {
        const prop = props[propName];
        if (
          prop instanceof OneOfGroup &&
          prop.options.group == name &&
          prop != this
        ) {
          prop.set(false);
        }
      }
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
  /** @type {function | null}
  compiled = null;
  /** @param {string} value
   * @param {PropOptions} options
   */
  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return this.labeled(
      html`<input
        type="text"
        .value=${this.value}
        id=${this.id}
        onchange=${({ target }) => {
          this.value = target.value;
          try {
            this.compiled = compileExpression(this.value);
            target.setCustomValidity("");
            target.reportValidity();
            this.update();
          } catch (e) {
            target.setCustomValidity(e.message);
            target.reportValidity();
          }
        }}
        title=${this.options.title}
        placeholder=${this.options.placeholder}
      />`,
    );
  }

  /** @param {string} value */
  set(value) {
    this.value = value;
    try {
      this.compiled = compileExpression(this.value);
    } catch (e) {
      console.error(e);
      console.log("value=", value, this);
    }
  }

  /** @param {Object} context */
  eval(context) {
    if (this.compiled && this.value) {
      const r = this.compiled(context);
      return r;
    } else {
      return this.options["valueWhenEmpty"];
    }
  }
}

export class Code extends Prop {
  value = "";
  editedValue = "";

  /** @type {string[]} */
  errors = [];

  /** @type {number[]} */
  lineOffsets = [];

  /** @param {PropOptions} options */
  constructor(value = "", options = {}) {
    options = {
      language: "css",
      replacements: {},
      ...options,
    };
    super(options);
    this.value = value;
  }

  /** @param {HTMLTextAreaElement} target */
  addLineNumbers = (target) => {
    const numberOfLines = target.value.split("\n").length;
    const lineNumbers = /** @type {HTMLTextAreaElement} */ (
      target.previousElementSibling
    );
    const numbers = [];
    for (let ln = 1; ln <= numberOfLines; ln++) {
      numbers.push(ln);
    }
    lineNumbers.value = numbers.join("\n");
    const rows = Math.max(4, Math.min(10, numberOfLines));
    target.rows = rows;
    lineNumbers.rows = rows;
    lineNumbers.scrollTop = target.scrollTop;
  };

  /** @param {number} offset - where the error happened
   * @param {string} message - the error message
   */
  addError(offset, message) {
    const line = this.value.slice(0, offset).match(/$/gm)?.length || "??";
    this.errors.push(`${line}: ${message}`);
  }

  /** Edit and validate the value */
  editCSS(props = {}, editSelector = (selector = "") => selector) {
    // replaces props in the full text
    let value = this.value;
    for (const prop in props) {
      value = value.replaceAll("$" + prop, props[prop]);
    }
    // clear the errors
    this.errors = [];
    // build the new rules here
    const editedRules = [];
    // match a single rule
    const ruleRE = /([\s\S]*?)({\s*[\s\S]*?}\s*)/dg;
    for (const ruleMatch of value.matchAll(ruleRE)) {
      let selector = ruleMatch[1];
      const indices = ruleMatch.indices;
      if (!indices) continue;
      const selectorOffset = indices[1][0];
      const body = ruleMatch[2];
      const bodyOffset = indices[2][0];
      // replace field names in the selector
      selector = selector.replace(
        /#(\w+)/g,
        (_, name) =>
          `data-${name.replace(
            /[A-Z]/g,
            (/** @type {string} */ m) => `-${m.toLowerCase()}`,
          )}`,
      );
      // prefix the selector so it only applies to the UI
      selector = `#UI ${editSelector(selector)}`;
      // reconstruct the rule
      const rule = selector + body;
      // add it to the result
      editedRules.push(rule);
      // validate the rule
      const styleSheet = new CSSStyleSheet();
      try {
        // add the rule to the sheet. If the selector is bad we'll get an
        // exception. If any properties are bad they will omitted in the
        // result. I'm adding a bogus ;gap:0; property to the end of the body
        // because we get an exception if there is only one invalid property.
        const index = styleSheet.insertRule(rule.replace("}", ";gap:0;}"));
        // retrieve the rule
        const newRule = styleSheet.cssRules[index].cssText;
        // extract the body
        const ruleRE = /([\s\S]*?)({\s*[\s\S]*?}\s*)/dg;
        const match = ruleRE.exec(newRule);
        if (match) {
          const newBody = match[2];
          const propRE = /[-\w]+:/g;
          const newProperties = newBody.match(propRE);
          for (const propMatch of body.matchAll(propRE)) {
            if (!newProperties || newProperties.indexOf(propMatch[0]) < 0) {
              // the property was invalid
              this.addError(
                bodyOffset + (propMatch.index || 0),
                `property ${propMatch[0]} is invalid`,
              );
            }
          }
        } else {
          this.addError(selectorOffset, "Rule is invalid");
        }
      } catch (e) {
        this.addError(selectorOffset, "Rule is invalid");
      }
    }
    this.editedValue = editedRules.join("");
  }

  input() {
    return this.labeled(
      html`<div class="Code">
        <div class="numbered-textarea">
          <textarea class="line-numbers" readonly></textarea>
          <textarea
            class="text"
            .value=${this.value}
            id=${this.id}
            onchange=${({ target }) => {
              this.value = target.value;
              this.editCSS();
              this.update();
            }}
            onkeyup=${(
              /** @type {{ target: HTMLTextAreaElement; }} */ event,
            ) => {
              this.addLineNumbers(event.target);
            }}
            onscroll=${({ target }) => {
              target.previousElementSibling.scrollTop = target.scrollTop;
            }}
            ref=${this.addLineNumbers}
            title=${this.options.title}
            placeholder=${this.options.placeholder}
          ></textarea>
        </div>
        <div class="errors">${this.errors.join("\n")}</div>
      </div>`,
    );
  }

  /** @param {string} value */
  set(value) {
    this.value = value;
    this.editCSS();
  }
}

export class Color extends Prop {
  value = "#ffffff";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return this.labeled(
      html`<color-input
        .value=${this.value}
        id=${this.id}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          this.value = event.target.value;
          this.update();
        }}
      />`,
    );
  }
}

export class Voice extends Prop {
  value = "";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return this.labeled(
      html`<select
        is="select-voice"
        .value=${this.value}
        id=${this.id}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          this.value = event.target.value;
          this.update();
        }}
      >
        <option value="">Default</option>
      </select>`,
    );
  }
}

export class ADate extends Prop {
  value = "";

  constructor(value = "", options = {}) {
    super(options);
    this.value = value;
  }

  input() {
    return this.labeled(
      html`<input
        type="date"
        .value=${this.value}
        id=${this.id}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          this.value = event.target.value;
          this.update();
        }}
      />`,
    );
  }
}
