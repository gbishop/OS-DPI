import { html, render } from "uhtml";
import { PropInfo } from "./properties";
import { componentMap, toDesign } from "./components/base";

/** @typedef {import('components/base').Base} Tree */

const symbols = {
  left: "&#129080;",
  right: "&#129082;",
  down: "&#129083;",
  up: "&#129081;",
};

/** @type {Tree} */
let selected = null;

/** @param {Tree} tree */
export function designer(tree) {
  /** @param {Tree} selection
   */
  function setSelected(selection) {
    selected = selection;
    while (selection.parent) {
      selection.parent.designer.expanded = true;
      selection = selection.parent;
    }
    localStorage.setItem("path", JSON.stringify(getPath(selected)));
    renderDesigner();
    selected.designer.current.focus();
    console.log("focus", document.activeElement, selected.designer.current);
  }

  function getNode(path) {
    return path.reduce((pv, index) => {
      return pv.children[index];
    }, tree);
  }

  function getPath(selection) {
    if (selection.parent) {
      const index = selection.parent.children.indexOf(selection);
      return [...getPath(selection.parent), index];
    }
    return [];
  }

  function addChild(type) {
    console.log("hey");
    const constructor = componentMap.component(type);
    const child = new constructor({}, selected.context, selected);
    selected.children.push(child);
    console.log({ type, constructor, child });
    setSelected(child);
    selected.context.state.update();
  }

  function addMenu() {
    const allowed = selected.allowedChildren();
    return html`<select
      class="menu"
      ?disabled=${!allowed.length}
      style="width: 7em"
      onchange=${(e) => {
        addChild(e.target.value);
        e.target.value = "";
      }}
    >
      <option selected disabled value="">Add</option>
      ${allowed.map((type) => html`<option value=${type}>${type}</option>`)}
    </select>`;
  }

  function visibleChidren(tree) {
    if (tree.children.length && tree.designer.expanded) {
      return tree.children.reduce(
        (result, child) => [...result, child, ...visibleChidren(child)],
        []
      );
    } else {
      return [];
    }
  }

  function next() {
    const vc = visibleChidren(tree);
    const ndx = Math.min(vc.indexOf(selected) + 1, vc.length - 1);
    return vc[ndx];
  }

  function previous() {
    const vc = visibleChidren(tree);
    const ndx = Math.max(0, vc.indexOf(selected) - 1);
    return vc[ndx];
  }

  function movement() {
    return html`<details class="menu">
      <summary>Move</summary>
    </details>`;
  }

  function deleteCurrent() {
    return html`<button>Delete</button>`;
  }

  /** @param {InputEvent} event */
  function propUpdate(event) {
    console.log("update", event);
    const name = event.target.name;
    const value = event.target.value;
    console.log({ name, value });
    selected.props[name] = value;
    selected.context.state.update();
  }

  /** @param {string} name */
  function prop(name) {
    const value = selected.props[name];
    const info = PropInfo[name];
    const label = html`<label for=${name}>${info.name}</label>`;
    console.log("prop", name, info.type);
    switch (info.type) {
      case "string":
        return html`<label for=${name}>${info.name}</label>
          <input
            type="text"
            id=${name}
            name=${name}
            .value=${value}
            onchange=${propUpdate}
          />`;
      case "number":
        return html`${label}
          <input
            type="number"
            id=${name}
            name=${name}
            .value=${value}
            onchange=${propUpdate}
          />`;
      case "color":
        console.log("color", name, value);
        return html`<label for=${name}>${info.name}</label>
          <color-input
            id=${name}
            name=${name}
            value=${value}
            onchange=${propUpdate}
          />`;
      case "select":
        return html`<label for=${name}>${info.name}</label>
          <select id=${name} name=${name} onchange=${propUpdate}>
            ${info.values.map(
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
            onchange=${propUpdate}
            oninput=${(/** @type {InputEvent} */ ev) => {
              console.log("input", ev);

              const target = /** @type {HTMLInputElement} */ (ev.target);
              if (!target.value.startsWith("$")) {
                target.value = "$" + target.value;
              }
            }}
          />`;
      case "tags":
        const tags = value.length ? [...value] : [""];
        return html`${tags.map((tag, index) => {
            console.log({ tag, index });
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
              renderDesigner();
            }}
          >
            Add tag
          </button>`;
      default:
        console.log("tbd", name);
        return html`<p>${name}</p>`;
    }
  }

  function props() {
    return Object.keys(PropInfo)
      .filter((name) => name in selected.props)
      .map((name) => prop(name));
  }

  function controls() {
    return html`<div class="controls">
      <h1>Editing ${selected.constructor.name} ${selected.name}</h1>
      ${addMenu()} ${movement()} ${deleteCurrent()}
      <div class="props">${props()}</div>
    </div>`;
  }
  /**
   * Display the designer interface
   * @param {Tree} tree
   * @param {Tree} selected
   * @returns {import('uhtml').Hole}
   */
  function showTree(tree, selected) {
    if (tree.children.length) {
      if (!tree.designer.hasOwnProperty("expanded")) {
        tree.designer.expanded = false;
      }
      const { expanded, focused } = tree.designer;
      return html`<li
        role="treeitem"
        aria=${{
          expanded,
          selected: selected === tree,
        }}
        tabindex=${selected === tree ? 0 : -1}
        ref=${tree.designer}
      >
        <span
          role="button"
          ?highlight=${selected === tree}
          onclick=${() => {
            if (selected === tree) {
              tree.designer.expanded = !tree.designer.expanded;
            }
            setSelected(tree);
          }}
        >
          ${tree.constructor.name} ${tree.name}
        </span>
        ${tree.designer.expanded
          ? html` <ul role="group">
              ${tree.children.map(
                (child) => html`${showTree(child, selected)}`
              )}
            </ul>`
          : html``}
      </li>`;
    } else {
      return html`<li
        role="treeitem"
        aria=${{ selected: selected === tree }}
        tabindex=${selected === tree ? 0 : -1}
        ref=${tree.designer}
      >
        <span
          role="button"
          ?highlight=${selected === tree}
          onclick=${() => setSelected(tree)}
          >${tree.constructor.name} ${tree.name}</span
        >
      </li>`;
    }
  }
  /** @param {KeyboardEvent} event */
  function treeKeyHandler(event) {
    console.log(event);
    switch (event.key) {
      case "ArrowDown":
        setSelected(next());
        break;
      case "ArrowUp":
        setSelected(previous());
        break;
      case "ArrowRight":
        if (selected.children.length && !selected.designer.expanded) {
          selected.designer.expanded = true;
          renderDesigner();
        } else if (selected.children.length) {
          setSelected(selected.children[0]);
        }
        break;
      case "ArrowLeft":
        if (selected.children.length && selected.designer.expanded) {
          selected.designer.expanded = false;
          renderDesigner();
        } else if (selected.parent) {
          setSelected(selected.parent);
        }
        break;
      default:
        console.log("ignored key", event);
    }
  }

  function renderDesigner() {
    if (!selected) {
      // restore the selected node if possible
      const jpath = localStorage.getItem("path");
      console.log("jpath", jpath);
      if (jpath) {
        try {
          const path = JSON.parse(jpath);
          const target = getNode(path);
          if (target) {
            setSelected(target);
          }
        } catch (error) {
          localStorage.removeItem("path");
        }
      }
    }
    if (!selected) {
      if (tree.children.length) {
        setSelected(tree.children[0]);
      } else {
        setSelected(tree);
      }
    }
    console.log("selected", selected);
    const designer = html`${controls()}
      <div class="tree">
        <ul role="tree" onKeyDown=${treeKeyHandler}>
          ${showTree(tree, selected)}
        </ul>
      </div>`;
    render(document.querySelector("#designer"), designer);
    // persist the design
    localStorage.setItem("design", JSON.stringify(toDesign(tree)));
  }
  tree.context.state.observe(renderDesigner);
  renderDesigner();
}
