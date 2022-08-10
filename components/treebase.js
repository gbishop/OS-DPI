import { html } from "uhtml";
import { Prop } from "./props";
import * as icons from "./icons";
import css from "ustyler";

export class TreeBase {
  /** @type {TreeBase[]} */
  children = [];
  /** @type {TreeBase} */
  parent = null;

  /** A mapping from the class name to the class */
  static classMap = new Map();
  /** @param {typeof TreeBase} cls */
  static register(cls) {
    this.classMap.set(cls.name, cls);
  }

  get className() {
    return this.constructor.name;
  }

  /**
   * Extract the class fields that are Props
   * @returns {Object<string, Prop>}
   */
  get props() {
    return Object.fromEntries(
      Object.entries(this).filter(([_, prop]) => prop instanceof Prop)
    );
  }

  /**
   * Extract the values of the fields that are Props
   * @returns {Object<string, string>}
   */
  get propsAsObject() {
    return Object.fromEntries(
      Object.entries(this.props).map(([name, prop]) => [name, prop.value])
    );
  }
  /**
   * Prepare a TreeBase tree for external storage by converting to simple objects and arrays
   * @returns {Object}
   * */
  toObject() {
    const props = this.propsAsObject;
    const children = this.children.map((child) => child.toObject());
    return {
      className: this.className,
      props,
      children,
    };
  }

  /**
   *   Create a TreeBase object
   *   @template {TreeBase} TB
   *   @param {string|(new()=>TB)} constructorOrName
   *   @param {TreeBase} parent
   *   @param {Object<string,string>} props
   *   @returns {TB}
   *   */
  static create(constructorOrName, parent = null, props = {}) {
    const constructor =
      typeof constructorOrName == "string"
        ? TreeBase.classMap.get(constructorOrName)
        : constructorOrName;
    const result = new constructor();

    // initialize the props
    for (const [name, prop] of Object.entries(result.props)) {
      if (name in props) {
        prop.set(props[name]);
      }
      // create a label if it has none
      prop.label =
        prop.label ||
        name // convert from camelCase to Camel Case
          .replace(/(?!^)([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
      // give each prop a link to the TreeBase that contains it.
      prop.container = result;
    }

    // link it to its parent
    if (parent) {
      result.parent = parent;
      parent.children.push(result);
    }

    return result;
  }

  /**
   * Instantiate a TreeBase tree from its external representation
   * @param {Object} obj
   * @param {TreeBase} parent
   * @returns {TreeBase} - should be {this} but that isn't supported for some reason
   * */
  static fromObject(obj, parent = null) {
    // Get the constructor from the class map
    const constructor = this.classMap.get(obj.className);
    if (!constructor) return null;

    // Create the object and link it to its parent
    const result = this.create(constructor, parent, obj.props);

    // Link in the children
    for (const childObj of obj.children) {
      TreeBase.fromObject(childObj, result);
    }

    // Validate the type is what was expected
    if (result instanceof this) return result;

    // Die if not
    console.error("expected", this);
    console.error("got", result);
    throw new Error(`fromObject failed`);
  }

  /**
   * Signal nodes above that something has been updated
   */
  update() {
    /** @type {TreeBase} */
    let start = this;
    let p = start;
    while (p) {
      p.onUpdate(start);
      p = p.parent;
    }
  }

  /**
   * Called something below is updated
   * @param {TreeBase} _start
   */
  onUpdate(_start) {}

  /**
   * Render this node and return the resulting Hole
   * @returns {Hole}
   */
  template() {
    return html``;
  }

  /**
   * @typedef {Object} Options
   * @property {string} [title]
   * @property {function():void} [onClick]
   */

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
        TreeBase.create(constructor, this);
        if (options.onClick) options.onClick();
        this.update();
      }}
    >
      ${label}
    </button>`;
  }

  /**
   * Swap two children
   * @param {TreeBase[]} A
   * @param {number} i
   * @param {number} j
   */
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
   * Create a button to delete the current item
   * @param {Options} options
   * @returns {Hole}
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

  /**
   * Create movement buttons
   */
  movementButtons(name = "") {
    return html`<div class="movement">
      ${this.moveUpButton({ title: `Move this ${name} up` })}
      ${this.moveDownButton({ title: `Move this ${name} down` })}
      ${this.deleteButton({ title: `Delete this ${name}` })}
    </div>`;
  }

  /**
   * Create HTML LI nodes from the children
   */
  listChildren(children = this.children) {
    return children.map((child) => html`<li>${child.template()}</li>`);
  }

  /**
   * Create an HTML ordered list from the children
   */
  orderedChildren(children = this.children) {
    return html`<ol>
      ${this.listChildren(children)}
    </ol>`;
  }

  /**
   * Create an HTML unordered list from the children
   * */
  unorderedChildren(children = this.children) {
    return html`<ul>
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
    while (p) {
      if (p instanceof type) {
        return p;
      }
      p = p.parent;
    }
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

/**
 * A variant of TreeBase that allows replacing a node with one of a similar type
 */
export class TreeBaseSwitchable extends TreeBase {
  /** Replace this node with one of a compatible type
   * @param {string} className */
  replace(className) {
    console.log("replacing", this.className, className);
    if (this.className == className) return;
    // extract the values of the old props
    const props = this.propsAsObject;
    const replacement = TreeBase.create(className, null, props);
    const index = this.parent.children.indexOf(this);
    this.parent.children[index] = replacement;
    replacement.parent = this.parent;
    this.update();
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
