import { html } from "uhtml";
import { PropInfo } from "../properties";
import { assemble } from "./base";
import { colorNamesDataList } from "./style";
import { Base, toDesign } from "./base";
import { Stack } from "./stack";
import { propEditor } from "./propEditor";
import db from "../db";
import broadcast from "../broadcast";
import css from "ustyler";

import { log } from "../log";

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

  init() {
    const { state, tree } = this.context;
    this.setSelected(this.getNode(state.get("path")), state.get("editingTree"));
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
    this.save();
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
      help="Add component"
      onchange=${(/** @type {InputEventWithTarget} */ e) => {
        this.closeControls();
        this.addChild(e.target.value);
        e.target.value = "";
      }}
    >
      <option selected disabled value="">Add</option>
      ${allowed.map((type) => html`<option value=${type}>${type}</option>`)}
    </select>`;
  }

  /** Move currently selected tree to the clipboard. Optionally
   *  deletes currently selected tree to simulate a C-x.
   *  @param {Tree} target
   *  @param {Boolean=} isCut
   */
  clipTree(target, isCut) {
    const targetDesign = JSON.stringify(toDesign(target));
    if (isCut) this.deleteCurrent();
    sessionStorage.setItem("clipboard", targetDesign);

    broadcast.channel.postMessage({
      name: db.designName,
      action: "copy",
      newName: targetDesign,
    });
  }

  /** Make clipboard contents a child of the parent parameter.
   * @param {Tree} target
   */
  pasteTree(target) {
    const clipboardContents = JSON.parse(sessionStorage.getItem("clipboard"));
    const assembledTree = assemble(
      clipboardContents,
      this.context,
      target
    );

    console.log(target, assembledTree);

    if(target.allowedChildren().includes(clipboardContents.type))
      target.children.push(assembledTree);
    else if(target.parent)
      target.parent.children.push(assembledTree);
    else
      this.context.tree.children.push(assembledTree);

    this.setSelected(assembledTree, true);
    this.save();
  }

  /** @returns {Hole} */
  cutButton() {
    return html`<button onclick=${() => this.clipTree(this.selected)}>
      Test Clip
    </button>`;
  }

  /** @returns {Hole} */
  pasteButton() {
    return html`<button onclick=${() => {
      this.pasteTree(this.selected)
    }}>
      Test Paste
    </button>`;
  }

  /** Move a component within its parent stack
   * @param {string} command
   */
  moveChild(command) {
    const selected = this.selected;
    const index = selected.index;
    const parent = selected.parent;
    if (!parent) return;
    const siblings = parent.children;
    const grandparent = parent?.parent;
    switch (command) {
      case "up":
        if (index > 0) {
          // swap with previous
          [siblings[index - 1], siblings[index]] = [
            siblings[index],
            siblings[index - 1],
          ];
        } else if (index == 0) {
          // move up into grandparent
          if (
            grandparent &&
            parent instanceof Stack &&
            grandparent instanceof Stack
          ) {
            parent.children.splice(index, 1);
            grandparent.children.splice(parent.index, 0, selected);
            selected.parent = grandparent;
          }
        }
        this.save();
        break;
      case "down":
        if (index < siblings.length - 1) {
          // swap with next
          [siblings[index + 1], siblings[index]] = [
            siblings[index],
            siblings[index + 1],
          ];
        } else if (index < siblings.length) {
          // move down into grandparent
          if (
            grandparent &&
            parent instanceof Stack &&
            grandparent instanceof Stack
          ) {
            parent.children.splice(index, 1);
            grandparent.children.splice(parent.index + 1, 0, selected);
            selected.parent = grandparent;
          }
        }
        this.save();
        break;
      case "new":
        // replace with a stack containing selected
        if (parent instanceof Stack) {
          const newStack = assemble(
            { type: "stack", props: {}, children: [] },
            selected.context,
            parent
          );
          parent.children.splice(index, 1, newStack);
          newStack.children.push(selected);
          selected.parent = newStack;
          this.save();
        }
        break;
      case "above": {
        // move into the stack immediately above
        const stack = selected.previousSibling();
        if (stack && stack instanceof Stack) {
          parent.children.splice(index, 1);
          stack.children.push(selected);
          selected.parent = stack;
          this.save();
        }
        break;
      }
      case "below": {
        // move into the stack immediately below
        const stack = selected.nextSibling();
        if (stack && stack instanceof Stack) {
          parent.children.splice(index, 1);
          stack.children.splice(0, 0, selected);
          selected.parent = stack;
          this.save();
        }
        break;
      }
      case "split":
        // split the current stack here
        if (
          grandparent &&
          parent instanceof Stack &&
          grandparent instanceof Stack
        ) {
          const stack = assemble(
            { type: "stack", props: {}, children: [] },
            selected.context,
            grandparent
          );
          stack.children = parent.children.splice(index);
          stack.children.forEach((child) => (child.parent = stack));
          grandparent.children.splice(parent.index + 1, 0, stack);
          this.save();
        }
        break;
    }
  }

  /** Create the move menu
   * @returns {Hole} */
  moveMenu() {
    const selected = this.selected;
    const index = selected.index;
    const parent = selected.parent;
    const siblings = parent?.children || [];
    const grandparent = parent?.parent;
    const isStack = parent instanceof Stack;
    const previous = selected.previousSibling();
    const next = selected.nextSibling();
    return html`<select
      class="menu"
      help="Move component"
      onchange=${(/** @type {InputEventWithTarget} */ e) => {
        const value = e.target.value;
        if (value) {
          this.moveChild(value);
        }
        e.target.value = "";
      }}
    >
      <option selected disabled value="">Move</option>
      <option
        value="up"
        ?disabled=${index == 0 &&
        (!grandparent || !(grandparent instanceof Stack) || !isStack)}
      >
        Move up
      </option>
      <option
        value="down"
        ?disabled=${index == siblings.length - 1 &&
        (!grandparent || !(grandparent instanceof Stack) || !isStack)}
      >
        Move down
      </option>
      <option value="new" ?disabled=${!isStack}>Move into new stack</option>
      <option
        value="above"
        ?disabled=${!isStack || !(previous instanceof Stack)}
      >
        Move into stack above
      </option>
      <option value="below" ?disabled=${!isStack || !(next instanceof Stack)}>
        Move into stack below
      </option>
      <option value="split" ?disabled=${!isStack}>Split stack here</option>
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
      help="Delete component"
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
          this.save();
        }
      }}
    >
      Delete
    </button>`;
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
            this.save();
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
    return html`<div class="controls">
      <h1>Editing ${this.selected.constructor.name} ${this.selected.name}</h1>
      ${this.addMenu()} ${this.deleteCurrent()} ${this.moveMenu()}
      ${this.cutButton()} ${this.pasteButton()}
      <div class="props">${this.showProps()}</div>
      <button
        id="controls-return"
        help="Return"
        onclick=${() => this.closeControls()}
      >
        Return</button
      ><button disabled help="Cancel">Cancel</button>
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
      const expanded = !!tree.designer.expanded;
      return html`<li
        role="treeitem"
        aria-expanded=${expanded}
        aria-selected=${selected === tree}
        tabindex=${selected === tree ? 0 : -1}
        ref=${setCurrent}
        .dataset=${{ componentId: tree.id }}
        help=${tree.constructor.name + " Component"}
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
        help=${tree.constructor.name + " Component"}
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
    return html`<div class="layout" help="Layout tab">
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
    this.context.state.update(patch);
  }

  /** save the layout to the db
   */
  save() {
    this.update();
    const { tree } = this.context;
    const layout = toDesign(tree);
    db.write("layout", layout);
  }
}

css`
  div.layout {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    overflow: hidden;
  }

  div.tree {
    overflow-y: auto;
  }

  .tree ul[role="tree"] {
    list-style-type: none;
    padding-inline-start: 5px;
  }
  .tree ul[role="group"] {
    list-style-type: none;
    margin-block-start: 0;
    padding-inline-start: 20px;
  }
  .tree li[aria-expanded] span::before {
    cursor: pointer;
    user-select: none;
  }

  .tree li[aria-expanded="false"] > span::before {
    content: "\u25B6";
    color: black;
    display: inline-block;
    margin-right: 6px;
  }

  .tree li[aria-expanded="true"] > span::before {
    content: "\u25B6";
    color: black;
    display: inline-block;
    margin-right: 6px;
    transform: rotate(90deg);
  }

  .tree li[aria-selected="true"] > span {
    background-color: pink;
  }

  div.empty {
    background-color: rgba(15, 15, 15, 0.3);
    justify-content: center;
    align-items: center;
  }

  div.empty::before {
    content: "Empty";
  }

  div.highlight {
    border: 1px solid red;
    box-sizing: border-box;
  }
`;
