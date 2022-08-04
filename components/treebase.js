import { html } from "uhtml";
import { Prop } from "./props";
import * as icons from "./icons";
import css from "ustyler";

export class TreeBase {
  /** @type Object<string, Prop> */
  props = {};
  /** @type {TreeBase[]} */
  children = [];
  /** @type {TreeBase} */
  parent = null;

  initialized = false;

  static classMap = new Map();
  /** @param {typeof TreeBase} cls */
  static register(cls) {
    this.classMap.set(cls.name, cls);
  }

  get className() {
    return this.constructor.name;
  }

  get level() {
    let i = 0,
      t = this.parent;
    while (t) {
      i += 1;
      t = t.parent;
    }
    return i % 3;
  }

  toObject() {
    const props = {};
    for (const name in this.props) {
      props[name] = this.props[name].value;
    }
    const children = this.children.map((child) => child.toObject());
    return {
      className: this.className,
      props,
      children,
    };
  }

  /** @param {Object} obj */
  static fromObject(obj, recursive = false) {
    const constructor = this.classMap.get(obj.className);
    if (!constructor) return null;
    const result = new constructor();
    for (const name in result.props) {
      if (name in obj.props) {
        result.props[name].set(obj.props[name]);
      }
    }
    for (const child of obj.children) {
      const c = this.fromObject(child, true);
      if (c) {
        result.addChild(c);
      }
    }
    if (!recursive) result.init_once();
    return result;
  }

  init_once() {
    if (!this.initialized) {
      this.init();
      this.initialized = true;
    }
  }

  /** Create labels for controls from their camelCase names */
  init() {
    for (const [name, value] of Object.entries(this.props)) {
      value.label =
        value.label ||
        name
          .replace(/(?!^)([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
    }
  }

  update() {
    if (this.parent) this.parent.update();
  }

  template() {
    return html``;
  }

  /**
   * @typedef {Object} Options
   * @property {string} [title]
   * @property {function():void} [onClick]
   */
  /** @param {TreeBase} child */
  addChild(child) {
    child.parent = this;
    this.children.push(child);
    child.init_once();
  }

  /**
   * @param {string} label
   * @param {typeof TreeBase} constructor
   * @param {Options} options
   * @returns
   */
  addChildButton(label, constructor, options = {}) {
    return html`<button
      title=${options.title}
      onClick=${() => {
        this.addChild(new constructor());
        if (options.onClick) options.onClick();
        this.update();
      }}
    >
      ${label}
    </button>`;
  }

  swap(A, i, j) {
    [A[i], A[j]] = [A[j], A[i]];
  }

  /**
   * @param {Options} options
   * @returns
   */
  moveUpButton(options = {}) {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    return html`<button
      class="treebase"
      title=${options.title}
      ?disabled=${index == 0}
      onClick=${() => {
        this.swap(peers, index, index - 1);
        if (options.onClick) options.onClick();
        this.update();
      }}
    >
      ${icons.UpArrow}
    </button>`;
  }

  /**
   * @param {Options} options
   * @returns
   */
  moveDownButton(options = {}) {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    return html`<button
      class="treebase"
      title=${options.title}
      ?disabled=${index >= peers.length - 1}
      onClick=${() => {
        this.swap(peers, index, index + 1);
        if (options.onClick) options.onClick();
        this.update();
      }}
    >
      ${icons.DownArrow}
    </button>`;
  }

  /**
   *  * Remove this child from their parent
   *  */
  remove() {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    peers.splice(index, 1);
    this.parent = null;
  }

  /**
   * @param {Options} options
   * @returns
   */
  deleteButton(options = {}) {
    return html`<button
      class="treebase"
      title=${options.title}
      onClick=${() => {
        const parent = this.parent;
        this.remove();
        if (options.onClick) options.onClick();
        parent.update();
      }}
    >
      ${icons.Trash}
    </button>`;
  }

  movementButtons(name = "") {
    return html`<div class="movement">
      ${this.moveUpButton({ title: `Move this ${name} up` })}
      ${this.moveDownButton({ title: `Move this ${name} down` })}
      ${this.deleteButton({ title: `Delete this ${name}` })}
    </div>`;
  }

  listChildren(children = this.children) {
    return children.map((child) => html`<li>${child.template()}</li>`);
  }
  orderedChildren(children = this.children) {
    return html`<ol level=${this.level}>
      ${this.listChildren(children)}
    </ol>`;
  }
  unorderedChildren(children = this.children) {
    return html`<ul level=${this.level}>
      ${this.listChildren(children)}
    </ul>`;
  }

  /**
   * Return the nearest parent of the given type
   * @template T
   * @param {new() => T} type
   * @returns {T}
   * */
  nearestParent(type) {
    let p = this.parent;
    console.log("nearestParent", { type, p });
    while (p) {
      if (p instanceof type) {
        return p;
      }
      p = p.parent;
      console.log({ p });
    }
    console.log("return null");
    return null;
  }

  /**
   * Filter children by their type
   * @template T
   * @param {new() => T} type
   * @returns {T[]}
   */
  filterChildren(type) {
    /** @type {T[]} */
    const result = [];
    for (const child of this.children) {
      if (child instanceof type) {
        result.push(child);
      }
    }
    return result;
  }
}

css`
  button.treebase {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 0.5em;
    border: outset;
  }
  button.treebase svg {
    object-fit: contain;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin: -4px;
  }
  .treebase .movement {
    margin-top: 0.5em;
  }
  .treebase button svg {
    object-fit: contain;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin: -4px;
  }
  .treebase button {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 0.5em;
    border: outset;
  }
  .treebase fieldset {
    margin-bottom: 0.5em;
    border-style: inset;
    border-width: 3px;
  }
  .treebase label[hiddenlabel] span {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
  .treebase label {
    display: inline-block;
  }
  .treebase input {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .treebase select {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .treebase ol {
    list-style-type: none;
    counter-reset: item;
    margin: 0;
    padding: 0;
  }

  .treebase ol > li {
    display: table;
    counter-increment: item;
    margin-bottom: 0.6em;
    width: 100%;
  }

  .treebase ol > li:before {
    content: counters(item, ".") ". ";
    display: table-cell;
    padding-right: 0.6em;
    font-size: 80%;
  }

  .treebase li ol > li {
    margin: 0;
  }

  .treebase li ol > li:before {
    content: counters(item, ".") " ";
  }
`;
