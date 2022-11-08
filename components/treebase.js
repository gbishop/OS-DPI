import { html } from "uhtml";
import * as Props from "./props";
import "css/treebase.css";
import { fromCamelCase } from "./helpers";
import WeakValue from "weak-value";

export class TreeBase {
  /** @type {TreeBase[]} */
  children = [];
  /** @type {TreeBase} */
  parent = null;
  /** @type {string[]} */
  allowedChildren = [];
  allowDelete = true;

  // every component has a unique id
  static treeBaseCounter = 0;
  id = `TreeBase-${TreeBase.treeBaseCounter++}`;

  // map from id to the component
  static idMap = new WeakValue();

  /** @param {string} id
   * @returns {TreeBase} */
  static componentFromId(id) {
    // strip off any added bits of the id
    const match = id.match(/TreeBase-\d+/);
    if (match) {
      return this.idMap.get(match[0]);
    }
    return null;
  }

  designer = {};

  /** A mapping from the external class name to the class */
  static nameToClass = new Map();
  /** A mapping from the class to the external class name */
  static classToName = new Map();

  /** @param {typeof TreeBase} cls
   * @param {string} externalName
   * */
  static register(cls, externalName) {
    this.nameToClass.set(externalName, cls);
    this.classToName.set(cls, externalName);
  }

  get className() {
    return TreeBase.classToName.get(this.constructor);
  }

  /**
   * Extract the class fields that are Props and return their values as an Object
   * @returns {Object<string, any>}
   */
  get props() {
    return Object.fromEntries(
      Object.entries(this)
        .filter(([_, prop]) => prop instanceof Props.Prop)
        .map(([name, prop]) => [name, prop.value])
    );
  }

  /**
   * Extract the values of the fields that are Props
   * @returns {Object<string, Props.Prop>}
   */
  get propsAsProps() {
    return Object.fromEntries(
      Object.entries(this).filter(([_, prop]) => prop instanceof Props.Prop)
    );
  }
  /**
   * Prepare a TreeBase tree for external storage by converting to simple objects and arrays
   * @returns {Object}
   * */
  toObject() {
    const props = this.props;
    const children = this.children.map((child) => child.toObject());
    return {
      className: this.className,
      props,
      children,
    };
  }

  init() {}

  /**
   *   Create a TreeBase object
   *   @template {TreeBase} TB
   *   @param {string|(new()=>TB)} constructorOrName
   *   @param {TreeBase} parent
   *   @param {Object<string,string|number|boolean>} props
   *   @returns {TB}
   *   */
  static create(constructorOrName, parent = null, props = {}) {
    const constructor =
      typeof constructorOrName == "string"
        ? TreeBase.nameToClass.get(constructorOrName)
        : constructorOrName;
    /** @type {TB} */
    const result = new constructor();

    // initialize the props
    for (const [name, prop] of Object.entries(result.propsAsProps)) {
      prop.initialize(name, props[name], result);
    }

    // link it to its parent
    if (parent) {
      result.parent = parent;
      parent.children.push(result);
    }

    // allow the component to initialize itself
    result.init();

    // remember the relationship between id and component
    TreeBase.idMap.set(result.id, result);

    return result;
  }

  /**
   * Instantiate a TreeBase tree from its external representation
   * @param {Object} obj
   * @param {TreeBase} parent
   * @returns {TreeBase} - should be {this} but that isn't supported for some reason
   * */
  static fromObject(obj, parent = null) {
    // map old names to new for the transition
    const typeToClassName = {
      audio: "Audio",
      stack: "Stack",
      page: "Page",
      grid: "Grid",
      speech: "Speech",
      button: "Button",
      logger: "Logger",
      gap: "Gap",
      option: "Option",
      radio: "Radio",
      vsd: "VSD",
      "modal dialog": "ModalDialog",
      "tab control": "TabControl",
      "tab panel": "TabPanel",
      display: "Display",
    };
    // Get the constructor from the class map
    if (!obj) console.trace("fromObject", obj);
    if ("type" in obj) {
      const newObj = { children: [...obj.children] };
      // convert to new representation
      if (obj.type === "grid" && "filters" in obj.props) {
        newObj.children = obj.props.filters.map((filter) => ({
          className: "GridFilter",
          props: { ...filter },
          children: [],
        }));
      }
      newObj.className = typeToClassName[obj.type];
      const { filters, ...props } = obj.props;
      newObj.props = props;
      obj = newObj;
    }
    const className = obj.className;
    const constructor = this.nameToClass.get(className);
    if (!constructor) {
      console.trace("className not found", className, obj);
      throw new Error("className not found");
    }

    // Create the object and link it to its parent
    const result = this.create(constructor, parent, obj.props);

    // Link in the children
    for (const childObj of obj.children) {
      if (childObj instanceof TreeBase) {
        childObj.parent = result;
        result.children.push(childObj);
      } else {
        TreeBase.fromObject(childObj, result);
      }
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
   * Called when something below is updated
   * @param {TreeBase} _start
   */
  onUpdate(_start) {}

  /**
   * Render the designer interface and return the resulting Hole
   * @returns {Hole}
   */
  settings() {
    return html`<div>
      <details class=${this.className}>
        <summary id=${this.id + "-settings"}>${this.settingsSummary()}</summary>
        ${this.settingsDetails()}
      </details>
      ${this.orderedChildren()}
    </div>`;
  }

  /**
   *  * Render the summary of a components settings
   *  * @returns {Hole}
   *  */
  settingsSummary() {
    const name = this.hasOwnProperty("name") ? this["name"].value : "";
    return html`${fromCamelCase(this.className)} ${name}`;
  }

  /**
   *  * Render the details of a components settings
   *  * @returns {Hole}
   *  */
  settingsDetails() {
    const props = this.propsAsProps;
    const inputs = Object.values(props).map((prop) => prop.input());
    return html`${inputs}`;
  }

  /**
   * Render the user interface and return the resulting Hole
   * @returns {Hole}
   */
  template() {
    return html`<!--empty-->`;
  }

  /**
   * Swap two of my children
   * @param {number} i
   * @param {number} j
   */
  swap(i, j) {
    const A = this.children;
    [A[i], A[j]] = [A[j], A[i]];
  }

  /**
   *  * Remove this child from their parent and return the id of the child to receive focus
   *  @returns {string}
   *  */
  remove() {
    const peers = this.parent.children;
    const index = peers.indexOf(this);
    const parent = this.parent;
    this.parent = null;
    peers.splice(index, 1);
    if (peers.length > index) {
      return peers[index].id;
    } else if (peers.length > 0) {
      return peers[peers.length - 1].id;
    } else {
      return parent.id;
    }
  }

  /**
   * Create HTML LI nodes from the children
   */
  listChildren(children = this.children) {
    return children.map(
      (child) => html.for(child)`<li>${child.settings()}</li>`
    );
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

  /* Methods from original Base many not used */

  /** Return matching strings from props
   * @param {RegExp} pattern
   * @param {string[]} [props]
   * @returns {Set<string>}
   */
  all(pattern, props) {
    const matches = new Set();
    for (const [name, theProp] of Object.entries(this.props)) {
      if (!props || props.indexOf(name) >= 0) {
        if (theProp instanceof Props.String) {
          for (const [match] of theProp.value.matchAll(pattern)) {
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

  /** Return a list of available Menu actions on this component
   *
   * @param {"add" | "delete" | "move" | "all"} which - whice actions to return
   * @returns {MenuAction[]}
   */
  getMenuActions(which = "all") {
    /** @type {MenuAction[]} */
    const result = [];
    // add actions
    if (which == "add" || which == "all") {
      for (const className of this.allowedChildren) {
        result.push(new MenuActionAdd(this, className));
      }
    }
    // delete
    if (which == "delete" || which == "all") {
      if (this.allowDelete) {
        result.push(new MenuActionDelete(this, this.className));
      }
    }

    // move
    if (which == "move" || which == "all") {
      if (this.parent) {
        const index = this.parent.children.indexOf(this);

        if (index > 0) {
          // moveup
          result.push(new MenuActionMove(this, this.className, index, -1));
        }
        if (index < this.parent.children.length - 1) {
          // movedown
          result.push(new MenuActionMove(this, this.className, index, 1));
        }
      }
    }
    return result;
  }
}

export class MenuAction {
  /** @type {TreeBase} component */
  component = null;
  className = "";

  /**
   * @returns {string} */
  apply() {
    return "";
  }
}

export class MenuActionAdd extends MenuAction {
  /** @param {TreeBase} component
   * @param {string} className */
  constructor(component, className) {
    super();
    this.component = component;
    this.className = className;
  }

  apply() {
    const result = TreeBase.create(this.className, this.component);
    return result.id;
  }
}

export class MenuActionDelete extends MenuAction {
  /** @param {TreeBase} component
   * @param {string} className */
  constructor(component, className) {
    super();
    this.component = component;
    this.className = className;
  }

  apply() {
    // remove returns the id of the nearest neighbor or the parent
    const nextId = this.component.remove();
    console.log({ nextId });
    return nextId;
  }
}

export class MenuActionMove extends MenuAction {
  /** @param {TreeBase} component
   * @param {string} className
   * @param {number} index
   * @param {number} step */
  constructor(component, className, index, step) {
    super();
    this.component = component;
    this.className = className;
    this.index = index;
    this.step = step;
  }

  apply() {
    this.component.parent.swap(this.index, this.index + this.step);
    return this.component.id;
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
    const props = this.props;
    const replacement = TreeBase.create(className, null, props);
    const index = this.parent.children.indexOf(this);
    this.parent.children[index] = replacement;
    replacement.parent = this.parent;
    this.update();
  }
}
