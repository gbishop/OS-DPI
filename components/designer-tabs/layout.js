import { html } from "uhtml";
import { PropInfo } from "../../properties";
import { TreeBase } from "../treebase";
import * as Props from "../props";
import { Stack } from "../stack";
import { TabControl, TabPanel } from "../tabcontrol";
import { propEditor } from "../propEditor";
import db from "../../db";
import css from "ustyler";
import Globals from "../../globals";

import { log } from "../../log";

/*
function html(...args) {
  log("html", args);
  return _html(...args);
}
*/

export class Layout extends TabPanel {
  /** Make sure a node is visible
   * @param {TreeBase} node
   */
  makeVisible(node) {
    while (node.parent) {
      node.parent.designer.expanded = true;
      if (node.parent instanceof TabControl) {
        const tc = node.parent;
        if (
          tc.props.stateName &&
          node.props.name &&
          Globals.state.get(tc.props.stateName) != node.props.name
        ) {
          Globals.state.update({
            [tc.props.stateName]: Globals.state.interpolate(node.props.name),
          });
        }
      }
      node = node.parent;
    }
  }

  /** @param {TreeBase} selection
   */
  setSelected(selection, editingTree = false, highlight = true) {
    this.selected = selection;
    this.makeVisible(this.selected);
    const state = Globals.state;
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
   * @returns {TreeBase}
   */
  getNode(path) {
    if (!path) path = [];
    let result = null;
    try {
      result = path.reduce((pv, index) => {
        return pv.children[index];
      }, Globals.tree);
    } catch (error) {}
    if (!result) result = Globals.tree;
    return result;
  }

  /** return the path from root to selection
   * @param {TreeBase} selection
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
    // const child = assemble({ type, props: {}, children: [] }, this.selected);
    // this.selected.children.push(child);
    // this.setSelected(child, true);
    // this.save();
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
   * @param {TreeBase} tree
   * @returns {TreeBase[]}
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
   * @param {TreeBase} tree
   * @returns {TreeBase[]}
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
   * @returns {TreeBase}
   * */
  nextVisibleChild() {
    const vc = this.visibleChidren(Globals.tree);
    const ndx = Math.min(vc.indexOf(this.selected) + 1, vc.length - 1);
    return vc[ndx];
  }

  /** Get the previous visible child
   * @returns {TreeBase}
   * */
  previousVisibleChild() {
    const vc = this.visibleChidren(Globals.tree);
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
   * @param {TreeBase} tree
   * @param {TreeBase} selected
   * @returns {Hole}
   */
  showTree(tree, selected, level = 0) {
    /** @param {HTMLElement} current */
    function setCurrent(current) {
      tree.designer.current = current;
      if (tree === selected) {
        // TODO: This steals focus from the UI on redraw.
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
          : html`<!--empty-->`}
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
    console.log("layout", this);
    return html`<div class="treebase layout" help="Layout tab" id=${this.id}>
      <ol>
        ${this.children.map((child) => html`<li>${child.settings()}</li>`)}
      </ol>
    </div>`;
  }

  /** Update the state
   * @param {Object} [patch]
   */
  update(patch) {
    Globals.state.update(patch);
  }

  /** save the layout to the db
   * likely out of date.
   */
  save() {
    console.log("Save called");
  }
}
TreeBase.register(Layout);

css`
  div.layout {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    overflow: hidden;
  }

  .layout ol {
    list-style-type: none;
  }

  .layout details {
    display: inline-block;
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
