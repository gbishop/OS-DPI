import { html } from "uhtml";
import { Prop } from "./props";
import * as icons from "./icons";

export class TreeBase {
  /** @type Object<string, Prop> */
  props = {};
  /** @type {TreeBase[]} */
  children = [];
  /** @type {TreeBase} */
  parent = null;

  static classMap = new Map();
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

  static fromObject(obj) {
    const constructor = this.classMap.get(obj.className);
    const result = new constructor();
    for (const name in obj.props) {
      result.props[name].value = obj.props[name];
    }
    for (const child of obj.children) {
      result.addChild(this.fromObject(child));
    }
    return result;
  }

  get Props() {
    for (const name in this.props) {
      this.props[name].label = name;
    }
    return this.props;
  }

  update() {
    if (this.parent) this.parent.update();
  }

  template() {
    return html``;
  }

  /**
   *
   * @param {TreeBase} child
   */
  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }
  /**
   *
   * @param {string} label
   * @param {typeof TreeBase} constructor
   * @returns
   */
  addChildButton(label, constructor) {
    return html`<button
      onClick=${() => {
        this.addChild(new constructor());
        this.update();
      }}
    >
      ${label}
    </button>`;
  }

  swap(A, i, j) {
    [A[i], A[j]] = [A[j], A[i]];
    this.update();
  }

  moveUpButton() {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    return html`<button
      ?disabled=${index == 0}
      onClick=${() => this.swap(peers, index, index - 1)}
    >
      ${icons.UpArrow}
    </button>`;
  }

  moveDownButton() {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    return html`<button
      ?disabled=${index >= peers.length - 1}
      onClick=${() => this.swap(peers, index, index + 1)}
    >
      ${icons.DownArrow}
    </button>`;
  }

  deleteButton() {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    return html`<button
      onClick=${() => {
        peers.splice(index, 1);
        this.update();
      }}
    >
      ${icons.Trash}
    </button>`;
  }

  movementButtons() {
    return html`<div class="movement">
      ${this.moveUpButton()} ${this.moveDownButton()} ${this.deleteButton()}
    </div>`;
  }

  listChildren() {
    return this.children.map((child) => html`<li>${child.template()}</li>`);
  }
  orderedChildren() {
    return html`<ol level=${this.level}>
      ${this.listChildren()}
    </ol>`;
  }
  unorderedChildren() {
    return html`<ul level=${this.level}>
      ${this.listChildren()}
    </ul>`;
  }
}
