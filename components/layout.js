import { html } from "uhtml";
import { PropInfo } from "../properties";
import { componentMap } from "./base";
import { getColor, validateColor, colorNamesDataList } from "./style";
import * as focusTrap from "focus-trap";
import { Base } from "./base";

/** @typedef {Base} Tree */

/** @type {Tree} */
let selected = null;

export class Layout extends Base {
  /** @param {Tree} tree
   * @param {Context} context
   * */
  constructor(context, tree) {
    super({}, context, null);
    console.log({ context, tree });
    this.tree = tree;
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
  setSelected(selection, editingTree = false) {
    selected = selection;
    this.makeVisible(selected);
    const state = this.context.state;
    state.update({ state, path: this.getPath(selected), editingTree });
    document.querySelector("#UI .highlight")?.classList.remove("highlight");
    document.querySelector(`#${selected.id}`)?.classList.add("highlight");
  }

  /** return a node given the path through the children to get to it
   * from the root.
   * @param {number[]} path
   * @returns {Tree}
   */
  getNode(path) {
    if (!path) path = [];
    return path.reduce((pv, index) => {
      return pv.children[index];
    }, this.tree);
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
    const constructor = componentMap.component(type);
    const child = new constructor({}, selected.context, selected);
    selected.children.push(child);
    this.setSelected(child);
    selected.context.state.update();
  }

  /** Create the add child menu */
  addMenu() {
    /** @type {string[]} */
    const allowed = selected.allowedChildren();
    return html`<select
      class="menu"
      ?disabled=${!allowed.length}
      style="width: 7em"
      onchange=${(/** @type {{ target: { value: string; }; }} */ e) => {
        this.trap.deactivate();
        this.addChild(e.target.value);
        e.target.value = "";
      }}
    >
      <option selected disabled value="">Add</option>
      ${allowed.map((type) => html`<option value=${type}>${type}</option>`)}
    </select>`;
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
    const vc = this.visibleChidren(this.tree);
    const ndx = Math.min(vc.indexOf(selected) + 1, vc.length - 1);
    return vc[ndx];
  }

  /** Get the previous visible child
   * @returns {Tree}
   * */
  previousVisibleChild() {
    const vc = this.visibleChidren(this.tree);
    const ndx = Math.max(0, vc.indexOf(selected) - 1);
    return vc[ndx];
  }

  /** Delete the current tree node */
  deleteCurrent() {
    return html`<button
      onclick=${() => {
        this.trap.deactivate();
        const index = selected.parent.children.indexOf(selected);
        console.log("index", index);
        selected.parent.children.splice(index, 1);
        if (selected.parent.children.length) {
          this.setSelected(selected.parent.children[Math.max(0, index - 1)]);
        } else {
          this.setSelected(selected.parent);
        }
        selected.context.state.update();
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
    console.log({ name, value });
    selected.props[name] = value;
    selected.context.state.update();
  }

  /** @param {string} name */
  prop(name) {
    const value = selected.props[name];
    const info = PropInfo[name];
    const label = html`<label for=${name}>${info.name}</label>`;
    switch (info.type) {
      case "string":
        return html`<label for=${name}>${info.name}</label>
          <input
            type="text"
            id=${name}
            name=${name}
            .value=${value}
            onchange=${this.propUpdate}
          />`;
      case "number":
        return html`${label}
          <input
            type="number"
            id=${name}
            name=${name}
            .value=${value}
            onchange=${this.propUpdate}
          />`;
      case "color":
        return html`<label for=${name}>${info.name}</label>
          <div class="color-input">
            <input
              id=${name}
              type="text"
              name=${name}
              .value=${value}
              list="ColorNames"
              onchange=${(
                /** @type {Event & { target: HTMLInputElement; }} */ event
              ) => validateColor(event) && this.propUpdate(event)}
            />
            <div
              class="swatch"
              style=${`background-color: ${getColor(value)}`}
            ></div>
          </div>`;
      case "select":
        return html`<label for=${name}>${info.name}</label>
          <select id=${name} name=${name} onchange=${this.propUpdate}>
            ${info.values?.map(
              (ov) =>
                html`<option value=${ov} ?selected=${ov == value}>
                  ${ov}
                </option>`
            )}
          </select>`;
      case "state":
        return html`<label for=${name}>${info.name}</label>
          <input
            type="text"
            id=${name}
            name=${name}
            .value=${value}
            onchange=${this.propUpdate}
            oninput=${(/** @type {InputEvent} */ ev) => {
              const target = /** @type {HTMLInputElement} */ (ev.target);
              if (!target.value.startsWith("$")) {
                target.value = "$" + target.value;
              }
            }}
          />`;
      case "tags":
        const tags = value.length ? [...value] : [""];
        return html`${tags.map((tag, index) => {
            const id = `${name}_${index}`;
            const hidden = index != 0;
            const label = index != 0 ? `${info.name} ${index + 1}` : info.name;
            return html`
              <label for=${id} ?hidden=${hidden}>${label}</label>
              <input
                type="text"
                id=${id}
                .value=${tag}
                onchange=${({ target: { value } }) => {
                  if (!value) {
                    tags.splice(index, 1);
                  } else {
                    tags[index] = value;
                  }
                  selected.props[name] = tags;
                  selected.context.state.update();
                }}
              />
            `;
          })}<button
            onclick=${() => {
              selected.props[name].push("NewTag");
              this.refresh(true);
            }}
          >
            Add tag
          </button>`;
      default:
        console.log("tbd", name);
        return html`<p>${name}</p>`;
    }
  }

  /** Render props for the selected element */
  showProps() {
    return Object.keys(PropInfo)
      .filter((name) => name in selected.props)
      .map((name) => this.prop(name));
  }

  /** Render the controls */
  controls() {
    return html`<div
      class="controls"
      ref=${(/** @type {HTMLElement} */ div) => {
        this.trap = focusTrap.createFocusTrap(div, {
          clickOutsideDeactivates: true,
          allowOutsideClick: true,
          onDeactivate: () => {
            console.log("deactivate trap");
            this.refresh();
          },
          onActivate: () => {
            console.log("activate trap");
          },
        });
        this.trap.activate();
      }}
    >
      <h1>Editing ${selected.constructor.name} ${selected.name}</h1>
      ${this.addMenu()} ${this.deleteCurrent()}
      <div class="props">${this.showProps()}</div>
      <button id="controls-return" onclick=${() => this.trap.deactivate()}>
        Return</button
      ><button disabled>Cancel</button>
    </div>`;
  }
  /**
   * Display the designer interface
   * @param {Tree} tree
   * @param {Tree} selected
   * @returns {import('uhtml').Hole}
   */
  showTree(tree, selected) {
    /** @param {HTMLElement} current */
    function setCurrent(current) {
      tree.designer.current = current;
      if (tree === selected) {
        current.focus();
      }
    }

    if (tree.children.length) {
      if (!tree.designer.hasOwnProperty("expanded")) {
        tree.designer.expanded = false;
      }
      const { expanded } = tree.designer;
      return html`<li
        role="treeitem"
        aria=${{
          expanded,
          selected: selected === tree,
        }}
        tabindex=${selected === tree ? 0 : -1}
        ref=${setCurrent}
      >
        <span
          role="button"
          onclick=${() => {
            if (selected === tree) {
              tree.designer.expanded = !tree.designer.expanded;
            }
            this.setSelected(tree, true);
          }}
        >
          ${tree.constructor.name} ${tree.name}
        </span>
        ${tree.designer.expanded
          ? html` <ul role="group">
              ${tree.children.map(
                (child) => html`${this.showTree(child, selected)}`
              )}
            </ul>`
          : html``}
      </li>`;
    } else {
      return html`<li
        role="treeitem"
        aria=${{ selected: selected === tree }}
        tabindex=${selected === tree ? 0 : -1}
        ref=${setCurrent}
      >
        <span role="button" onclick=${() => this.setSelected(tree, true)}
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
        if (selected.children.length && !selected.designer.expanded) {
          selected.designer.expanded = true;
          this.refresh();
        } else if (selected.children.length) {
          this.setSelected(selected.children[0]);
        }
        break;
      case "ArrowLeft":
        if (selected.children.length && selected.designer.expanded) {
          selected.designer.expanded = false;
          this.refresh();
        } else if (selected.parent) {
          this.setSelected(selected.parent);
        }
        break;
      case " ":
      case "Enter":
        this.refresh(true);
        break;
      default:
        console.log("ignored key", event);
    }
  }

  template() {
    const state = this.context.state;
    const editingTree = state.get("editingTree");
    selected = this.getNode(state.get("path"));
    this.makeVisible(selected);
    console.log("selected", selected);
    return html`<div class="tree">
        <ul
          role="tree"
          onKeyDown=${
            /** @param {KeyboardEvent} event */ (event) =>
              this.treeKeyHandler(event)
          }
        >
          ${this.showTree(this.tree, selected)}
        </ul>
      </div>
      ${editingTree ? this.controls() : html``} ${colorNamesDataList()}`;
  }

  /** Update the editing flag and request a refresh
   * @param {boolean} editingTree
   */
  refresh(editingTree = false) {
    this.context.state.update({ editingTree });
  }
}
