import { html } from "../_snowpack/pkg/uhtml.js";
import { PropInfo } from "../properties.js";
import { assemble } from "./base.js";
import { colorNamesDataList } from "./style.js";
import { Base } from "./base.js";
import { propEditor } from "./propEditor.js";

import { log } from "../log.js";

/*
function html(...args) {
  log("html", args);
  return _html(...args);
}
*/

export class Layout extends Base {
  static defaultProps = {
    scale: "1",
  };

  /**
   * @param {SomeProps} props
   * @param {Context} context
   * @param {Base} parent
   */
  constructor(props, context, parent) {
    super(props, context, parent);

    // assure that selected always has a value */
    /** @type {Base} */
    this.selected = this.context.tree;
  }

  init() {
    const { state, tree } = this.context;
    this.setSelected(this.getNode(state.get("path")));
    document.querySelector("div#UI")?.addEventListener("click", (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      let id = null;
      if (target instanceof HTMLButtonElement && target.dataset.id) {
        id = target.dataset.id;
      } else {
        const div = target.closest('div[id^="osdpi"]');
        if (div) {
          id = div.id;
        }
      }
      if (id) {
        const component = this.allChildren(tree).find(
          (child) => child.id == id
        );
        if (component) {
          this.setSelected(component, false, false);
        }
      }
    });
  }

  /** Make sure a node is visible
   * @param {Tree} node
   */
  makeVisible(node) {
    while (node.parent) {
      node.parent.designer.expanded = true;
      node = node.parent;
    }
  }

  /** @param {Tree} selection
   */
  setSelected(selection, editingTree = false, highlight = true) {
    log("setSelected", selection.constructor.name, selection.id);
    this.selected = selection;
    this.makeVisible(this.selected);
    const state = this.context.state;
    state.update({ path: this.getPath(this.selected), editingTree });
    document.querySelector("#UI .highlight")?.classList.remove("highlight");
    const uinode = document.getElementById(this.selected.id);
    if (uinode && highlight) {
      uinode.classList.add("highlight");
      uinode.closest(".modal")?.classList.add("highlight");
    }
  }

  /** return a node given the path through the children to get to it
   * from the root.
   * @param {number[]} path
   * @returns {Tree}
   */
  getNode(path) {
    if (!path) path = [];
    let result = null;
    try {
      result = path.reduce((pv, index) => {
        return pv.children[index];
      }, this.context.tree);
    } catch (error) {}
    if (!result) result = this.context.tree;
    return result;
  }

  /** return the path from root to selection
   * @param {Tree} selection
   * @returns {number[]}
   */
  getPath(selection) {
    if (selection.parent) {
      const index = selection.parent.children.indexOf(selection);
      return [...this.getPath(selection.parent), index];
    }
    return [];
  }

  /** Add a child of the given type to the current selection
   * @param {string} type
   */
  addChild(type) {
    const child = assemble(
      { type, props: {}, children: [] },
      this.selected.context,
      this.selected
    );
    this.selected.children.push(child);
    this.setSelected(child, true);
    this.selected.context.state.update();
  }

  /** Create the add child menu */
  /** @returns {Hole} */
  addMenu() {
    /** @type {string[]} */
    const allowed = this.selected.allowedChildren();
    return html`<select
      class="menu"
      ?disabled=${!allowed.length}
      style="width: 7em"
      onchange=${(/** @type {{ target: { value: string; }}} */ e) => {
        this.closeControls();
        this.addChild(e.target.value);
        e.target.value = "";
      }}
    >
      <option selected disabled value="">Add</option>
      ${allowed.map((type) => html`<option value=${type}>${type}</option>`)}
    </select>`;
  }

  /** Get a list of all children
   * @param {Tree} tree
   * @returns {Tree[]}
   * */
  allChildren(tree) {
    if (tree.children.length) {
      return tree.children.reduce(
        (result, child) => [...result, child, ...this.allChildren(child)],
        []
      );
    } else {
      return [];
    }
  }

  /** Get a list of the children that are visible
   * @param {Tree} tree
   * @returns {Tree[]}
   * */
  visibleChidren(tree) {
    if (tree.children.length && tree.designer.expanded) {
      return tree.children.reduce(
        (result, child) => [...result, child, ...this.visibleChidren(child)],
        []
      );
    } else {
      return [];
    }
  }

  /** Get the next visible child
   * @returns {Tree}
   * */
  nextVisibleChild() {
    const vc = this.visibleChidren(this.context.tree);
    const ndx = Math.min(vc.indexOf(this.selected) + 1, vc.length - 1);
    return vc[ndx];
  }

  /** Get the previous visible child
   * @returns {Tree}
   * */
  previousVisibleChild() {
    const vc = this.visibleChidren(this.context.tree);
    const ndx = Math.max(0, vc.indexOf(this.selected) - 1);
    return vc[ndx];
  }

  /** Delete the current tree node */
  deleteCurrent() {
    return html`<button
      onclick=${() => {
        this.closeControls();
        const parent = this.selected.parent;
        if (parent) {
          const index = parent.children.indexOf(this.selected);
          parent.children.splice(index, 1);
          if (parent.children.length) {
            this.setSelected(parent.children[Math.max(0, index - 1)]);
          } else {
            this.setSelected(parent);
          }
          this.selected.context.state.update();
        }
      }}
    >
      Delete
    </button>`;
  }

  /** @param {Event & { target: HTMLInputElement }} event
   */
  propUpdate({ target }) {
    const name = target.name;
    const value = target.value;
    this.selected.props[name] = value;
    this.selected.context.state.update();
  }

  /** Render props for the selected element */
  showProps() {
    return Object.entries(PropInfo)
      .filter(([name, _]) => name in this.selected.defaultProps)
      .map(([name, info]) => {
        return propEditor(
          this.selected,
          name,
          this.selected.props[name],
          info,
          this.context,
          (name, value) => {
            this.selected.props[name] = value;
            this.selected.context.state.update();
            this.update();
          }
        );
      });
  }

  /** close the editing controls */
  closeControls() {
    this.update({ editingTree: false });
  }

  /** Render the controls */
  controls() {
    log("selected", this.selected);
    log("controls");
    return html`<div class="controls">
      <h1>Editing ${this.selected.constructor.name} ${this.selected.name}</h1>
      ${this.addMenu()} ${this.deleteCurrent()}
      <div class="props">${this.showProps()}</div>
      <button id="controls-return" onclick=${() => this.closeControls()} }>
        Return</button
      ><button disabled>Cancel</button>
    </div>`;
  }
  /**
   * Display the designer interface
   * @param {Tree} tree
   * @param {Tree} selected
   * @returns {Hole}
   */
  showTree(tree, selected, level = 0) {
    /** @param {HTMLElement} current */
    function setCurrent(current) {
      tree.designer.current = current;
      if (tree === selected) {
        current.focus();
      }
    }
    if (tree.children.length > 0) {
      if (!tree.designer.hasOwnProperty("expanded")) {
        tree.designer.expanded = level < 3;
      }
      const expanded = !!tree.designer.designer;
      return html`<li
        role="treeitem"
        aria-expanded=${expanded}
        aria-selected=${selected === tree}
        tabindex=${selected === tree ? 0 : -1}
        ref=${setCurrent}
        .dataset=${{ componentId: tree.id }}
      >
        <span
          role="button"
          onclick=${() => {
            if (tree.designer.expanded && tree !== this.selected) {
              this.setSelected(tree, true);
            } else {
              tree.designer.expanded = !tree.designer.expanded;
              this.setSelected(tree, true);
            }
          }}
          .dataset=${{ componentId: tree.id }}
        >
          ${tree.constructor.name} ${tree.name}
        </span>
        ${tree.designer.expanded
          ? html`<ul role="group" .dataset=${{ componentId: tree.id }}>
              ${tree.children.map((child) =>
                this.showTree(child, selected, level + 1)
              )}
            </ul>`
          : html``}
      </li>`;
    } else {
      return html`<li
        role="treeitem"
        aria-selected=${selected === tree}
        tabindex=${selected === tree ? 0 : -1}
        ref=${setCurrent}
        .dataset=${{ componentId: tree.id }}
      >
        <span
          role="button"
          onclick=${() => this.setSelected(tree, true)}
          .dataset=${{ componentId: tree.id }}
          >${tree.constructor.name} ${tree.name}</span
        >
      </li>`;
    }
  }
  /** @param {KeyboardEvent} event */
  treeKeyHandler(event) {
    switch (event.key) {
      case "ArrowDown":
        this.setSelected(this.nextVisibleChild());
        break;
      case "ArrowUp":
        this.setSelected(this.previousVisibleChild());
        break;
      case "ArrowRight":
        if (this.selected.children.length && !this.selected.designer.expanded) {
          this.selected.designer.expanded = true;
          this.update();
        } else if (this.selected.children.length) {
          this.setSelected(this.selected.children[0]);
        }
        break;
      case "ArrowLeft":
        if (this.selected.children.length && this.selected.designer.expanded) {
          this.selected.designer.expanded = false;
          this.update();
        } else if (this.selected.parent) {
          this.setSelected(this.selected.parent);
        }
        break;
      case " ":
      case "Enter":
        this.update({ editingTree: true });
        break;
      default:
        log("ignored key", event);
    }
  }

  template() {
    const state = this.context.state;
    const editingTree = state.get("editingTree");
    /** @param {KeyboardEvent} event */
    const keyHandler = (event) => this.treeKeyHandler(event);
    return html`<div class="layout">
      <div class="tree">
        <ul role="tree" onKeyDown=${keyHandler}>
          ${this.showTree(this.context.tree, this.selected)}
        </ul>
      </div>
      ${editingTree && this.selected ? this.controls() : html``}
      ${colorNamesDataList()}
    </div>`;
  }

  /** Update the state
   * @param {Object} [patch]
   */
  update(patch) {
    this.selected.context.state.update();
    this.context.state.update(patch);
  }
}
