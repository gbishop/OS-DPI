import { html, render } from "uhtml";
import { hooked, useRef, useState } from "uhooks";

/** @typedef {Object} Item
 * @property {number[]} values
 */

/** @type {Item[]} */
const Data = [{ values: [1] }, { values: [2, 3] }, { values: [4, 5, 6] }];

let index = 0;

const check = {};
function main() {
  console.log("main start");
  render(
    document.body,
    html`<p>I'm thinking about hooks</p>
      <button
        onclick=${() => {
          index = (index + 1) % Data.length;
          main();
        }}
      >
        ${index}
      </button>
      <input type="checkbox" ref=${check} onchange=${main} />
      <p>${JSON.stringify(Data)}</p>
      <div .item=${Data[index]} ref=${editor} /> `
  );
  console.log("main end");
}

const contentSet = new Set();

const editor = hooked((node) => {
  console.log("content start");
  const item = node.item;
  console.log("item", item);
  const [previous, setPrevious] = useState({ item, row: [...item.values] });
  if (item !== previous.item) {
    setPrevious({ item, row: [...item.values] });
  }
  const row = [...previous.row];
  console.log("row", row);
  /** @param {number} index
   * @param {number} value
   */
  function update(index, value) {
    row[index] = value;
    console.log("update", index, value);
    setPrevious({
      item,
      row,
    });
    item.values = row.filter((v) => v != 0);
    main();
  }
  render(
    node,
    html`<ul>
        ${row.map(
          (d, i) => html`<li>
            <input
              type="number"
              .value=${d}
              onchange=${(e) => update(i, +e.target.value)}
            />
          </li>`
        )}
      </ul>
      <button
        onclick=${() => {
          console.log("clicked");
          update(row.length, 0);
        }}
      >
        +
      </button> `
  );
  console.log("content end");
});

let oldNode = null;
let hook = null;
function foo(node) {
  if (oldNode !== node) {
    console.log("hooking");
    hook = hooked(f);
    oldNode = node;
  }
  hook(node, true);
}

/** @param {number} init */
function h(init, reset = false) {
  return html`<div ref=${hooked(foo)}>stuff</div>`;
  function foo(/** @type {Node} */ node) {
    console.log(node);
    const ref = useRef(node);
    console.log("ref", ref);
    console.log("rc", ref.current, init);
    const [count, setCount] = useState(init);
    if (reset) setCount(init);
    render(
      ref.current,
      html`<p>
        <button onclick=${() => setCount((value) => value + 1)}>
          ${count}
        </button>
        <button onclick=${main}>Render all</button>
      </p>`
    );
    console.log("f");
  }
}

/** @param {number} init */
function g(init) {
  return html`<div
    ref=${hooked((/** @type {Node} */ node) => {
      console.log(node);
      const ref = useRef(node);
      console.log("ref", ref);
      console.log("rc", ref.current, init);
      const [count, setCount] = useState(init);
      render(
        ref.current,
        html`<p>
          <button onclick=${() => setCount((value) => value + 1)}>
            ${count}
          </button>
        </p>`
      );
      console.log("f");
    })}
  >
    stuff
  </div>`;
}

function f(/** @type {Node} */ node) {
  console.log(node);
  const [count, setCount] = useState(/** @type {number} */ node.initial);
  render(
    node,
    html`<p>
      <button onclick=${() => setCount((value) => value + 1)}>${count}</button>
      <button onclick=${main}>Render all</button>
    </p>`
  );
  console.log("f");
}

main();
