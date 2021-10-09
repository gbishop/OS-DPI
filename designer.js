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
    localStorage.setItem("path", JSON.stringify(getPath(selected)));
    renderDesigner();
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
    if (
      tree.children.length &&
      tree.designer?.current instanceof HTMLDetailsElement &&
      tree.designer.current.open
    ) {
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

  function navigation() {
    return html`<span class="arrows">
      <button
        id="ArrowUp"
        title="previous"
        onclick=${() => {
          setSelected(previous());
        }}
      >
        &#129081;
      </button>
      <button
        id="ArrowDown"
        title="next"
        onclick=${() => {
          setSelected(next());
        }}
      >
        &#129083;
      </button>
      <button
        id="ArrowRight"
        title="open"
        ?disabled=${!selected.children.length}
        onclick=${() => {
          if (selected.designer.current.open) {
            setSelected(selected.children[0]);
          } else {
            selected.designer.current.open = true;
          }
        }}
      >
        &#129082;
      </button>
      <button
        id="ArrowLeft"
        title="parent"
        ?disabled=${!selected.parent}
        onclick=${() => {
          if (
            selected.designer.current instanceof HTMLDetailsElement &&
            selected.designer.current.open
          ) {
            selected.designer.current.open = false;
          } else {
            setSelected(selected.parent);
          }
        }}
      >
        &#129080;
      </button>
    </span>`;
  }

  function movement() {
    return html`<details class="menu">
      <summary>Move</summary>
    </details>`;
  }

  function deleteCurrent() {
    return html`<button>Delete</button>`;
  }

  function propUpdate(event) {
    console.log("update", event);
    const name = event.target.name;
    const value = event.target.value;
    console.log({ name, value });
    selected.props[name] = value;
    selected.context.state.update();
  }

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
            .value=${value}
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
            oninput=${(ev) => {
              console.log("input", ev);
              if (!ev.target.value.startsWith("$")) {
                ev.target.value = "$" + ev.target.value;
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
                onchange=${(ev) => {
                  const nv = ev.target.value;
                  if (!nv) {
                    tags.splice(index, 1);
                  } else {
                    tags[index] = ev.target.value;
                  }
                  selected.props[name] = tags;
                  selected.context.state.update();
                }}
              />
            `;
          })}<button
            onclick=${(ev) => {
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

  /** @param {KeyboardEvent} ev */
  function controlKeys(ev) {
    if (
      ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].indexOf(ev.key) >= 0
    ) {
      const button = document.getElementById(ev.key);
      button.click();
    }
  }

  function controls() {
    return html`<div class="controls" onkeydown=${controlKeys} tabindex="0">
      <h1>Editing ${selected.constructor.name} ${selected.name}</h1>
      ${addMenu()} ${navigation()} ${movement()} ${deleteCurrent()}
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
      return html`<details open ref=${tree.designer}>
        <summary
          ?highlight=${selected === tree}
          onclick=${(ev) => {
            if (selected !== tree) {
              ev.preventDefault();
            }
            setSelected(tree);
          }}
        >
          ${tree.constructor.name} ${tree.name}
        </summary>
        <ul>
          ${tree.children.map(
            (child) => html`<li>${showTree(child, selected)}</li>`
          )}
        </ul>
      </details>`;
    } else {
      return html`<span
        ?highlight=${selected === tree}
        ref=${tree.designer}
        onclick=${() => setSelected(tree)}
        >${tree.constructor.name} ${tree.name}</span
      >`;
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
          selected = getNode(path);
        } catch (error) {
          localStorage.removeItem("path");
        }
      }
    }
    if (!selected) {
      selected = tree.children[0] || tree;
    }
    console.log("selected", selected);
    const designer = html`${controls()}${showTree(tree, selected)}`;
    render(document.querySelector("#designer"), designer);
    // persist the design
    localStorage.setItem("design", JSON.stringify(toDesign(tree)));
  }
  tree.context.state.observe(renderDesigner);
  renderDesigner();
}
