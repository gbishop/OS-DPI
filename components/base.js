import { html } from "uhtml";

class ComponentNameMap {
  componentFromName = new Map();
  nameFromComponent = new Map();

  /**
   * @param {string} name
   * @param {typeof Base} component
   */
  addMap(name, component) {
    this.componentFromName.set(name, component);
    this.nameFromComponent.set(component, name);
  }

  /** @param {Base} component
   * @returns {string}
   */
  name(component) {
    return this.nameFromComponent.get(
      Object.getPrototypeOf(component).constructor
    );
  }

  /** @param {string} name
   * @returns {typeof Base}
   */
  component(name) {
    return this.componentFromName.get(name);
  }
}

export const componentMap = new ComponentNameMap();

let idCounter = 0;
function nextId() {
  return `osdpi${idCounter++}`;
}

/** @type {Props} */
const allProps = {
  scale: "1",
  background: "",
  selected: "",
  unselected: "",
  rows: 1,
  columns: 1,
  filters: [],
  stateName: "",
  name: "",
  label: "",
  choices: [],
  direction: "column",
  value: "",
  tabEdge: "bottom",
  fontSize: "1",
  voiceURI: "",
  pitch: 0,
  rate: 0,
  volume: 0,
  fillItems: false,
};

export class Base {
  /** defaultProps is where we specify the props used by a component
   * @type {SomeProps} */
  static defaultProps = {};

  /** Provides access to the class variable defaultProps
   * @returns {SomeProps} */
  get defaultProps() {
    // @ts-ignore: undefined property
    return this.constructor.defaultProps;
  }

  /** @type {string[]} */
  static allowedChildren = [];

  /** @type {Base[]} */
  children = [];

  /**
   * @param {SomeProps} props
   * @param {Base|Null} parent
   */
  constructor(props, parent = null) {
    /** @type {Props} */
    this.props = {
      ...allProps,
      ...this.defaultProps,
      ...props,
    };
    /** @type {Base[]} */
    this.children = [];
    this.parent = parent;
    this.designer = {};
    this.id = nextId();

    // wrong place
    this.init();
  }

  /** called after the node is constructed */
  init() {}

  /**
   * Return the content for element.
   * @returns {Hole}
   */
  template() {
    return html``;
  }

  get index() {
    const siblings = this.parent?.children || [];
    return siblings.indexOf(this);
  }

  nextSibling() {
    const siblings = this.parent?.children || [];
    const ndx = siblings.indexOf(this);
    if (ndx < 0 || ndx == siblings.length - 1) {
      return null;
    } else {
      return siblings[ndx + 1];
    }
  }
  previousSibling() {
    const siblings = this.parent?.children || [];
    const ndx = siblings.indexOf(this);
    if (ndx < 1) {
      return null;
    } else {
      return siblings[ndx - 1];
    }
  }

  allowedChildren() {
    // @ts-ignore
    return this.constructor.allowedChildren;
  }

  get name() {
    return this.props.name || "";
  }

  get path() {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      return this.parent.path + `[${index}]` + this.constructor.name;
    }
    return this.constructor.name;
  }

  /** Return matching strings from props
   * @param {RegExp} pattern
   * @param {string[]} [props]
   * @returns {Set<string>}
   */
  all(pattern, props) {
    const matches = new Set();
    for (const [prop, value] of Object.entries(this.props)) {
      if (!props || props.indexOf(prop) >= 0) {
        if (typeof value === "string") {
          for (const [match] of value.matchAll(pattern)) {
            matches.add(match);
          }
        }
      }
    }
    for (const child of this.children) {
      for (const match of child.all(pattern, props)) {
        matches.add(match);
      }
    }
    return matches;
  }

  /** @returns {Set<string>} */
  allStates() {
    return this.all(/\$\w+/g);
  }
}

/**
 * @param {Design} design
 * @param {Base|Null} parent
 */

export function assemble(design, parent = null) {
  const node = new (componentMap.component(design.type))(design.props, parent);
  node.children = design.children.map((child) => assemble(child, node));
  return node;
}

/**
 * @param {Base} tree
 * @returns {Design}
 */
export function toDesign(tree) {
  // @ts-ignore
  const defaultProps = tree.constructor.defaultProps;
  return {
    type: componentMap.name(tree),
    props: Object.fromEntries(
      Object.entries(tree.props).filter(([key, _]) => key in defaultProps)
    ),
    children: tree.children.map(toDesign),
  };
}

class Page extends Base {
  static defaultProps = {};
  static allowedChildren = ["stack", "modal dialog", "speech", "audio"];

  template() {
    return html`${this.children.map((child) => child.template())}`;
  }
}
componentMap.addMap("page", Page);
