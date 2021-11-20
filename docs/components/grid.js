import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";
import { formatSlottedString } from "./helpers.js";
import css from "../_snowpack/pkg/ustyler.js";

class Grid extends Base {
  static defaultProps = {
    rows: 3,
    columns: 3,
    tags: [],
    match: "contains",
    name: "grid",
    background: "white",
    scale: "1",
  };
  page = 0;
  /** @type {Object}
   * @property {string} key
   * @property {Rows} items
   */
  cache = { key: "", items: [] };

  template() {
    /** @type {Partial<CSSStyleDeclaration>} */
    const style = {};
    const { data, state, rules } = this.context;
    const { rows, columns, match, name, background } = this.props;
    const tags = state.normalizeTags(this.props.tags);
    const key = tags.join("|");
    /** @type {Rows} */
    let items;
    if (this.cache.items.length && this.cache.key === key) {
      items = this.cache.items;
    } else {
      items = data.getTaggedRows(tags, match);
      this.cache.items = items;
      this.cache.key = key;
      this.page = 0;
    }
    const result = [];
    style.gridTemplate = `repeat(${rows}, calc(100% / ${rows})) / repeat(${columns}, 1fr)`;

    let perPage = rows * columns;
    let pages = 1;
    if (items.length > perPage) {
      perPage = rows * columns - 1;
      pages = Math.ceil(items.length / perPage);
    }
    if (this.page >= pages) {
      this.page = 0;
    }
    const offset = this.page * perPage;

    for (let i = offset; i < Math.min(items.length, perPage + offset); i++) {
      const item = items[i];
      let itemIndex = i;
      while (offset + result.length < itemIndex) {
        result.push(html`<button tabindex="-1" disabled></button>`);
      }
      let content;
      let msg = formatSlottedString(item.label || "");
      if (item.symbol) {
        content = html`<div>
          <figure>
            <img src=${item.symbol} title=${item.label || ""} />
            <figcaption>${msg}</figcaption>
          </figure>
        </div>`;
      } else {
        content = msg;
      }
      result.push(
        html`<button
          onClick=${rules.handler(name, item, "press")}
          style=${styleString({ backgroundColor: background })}
          tabindex="-1"
        >
          ${content}
        </button>`
      );
    }
    while (result.length < perPage) {
      result.push(html`<button tabindex="-1" disabled></button>`);
    }
    if (perPage < rows * columns) {
      result.push(html`<div class="page-control">
        <div class="text">Page ${this.page + 1} of ${pages}</div>
        <div class="back-next">
          <button
            onClick=${() => {
              this.page = (((this.page - 1) % pages) + pages) % pages;
              state.update(); // trigger redraw
            }}
            style=${styleString({ backgroundColor: background })}
            .disabled=${perPage >= items.length}
            tabindex="-1"
          >
            &#9754;</button
          ><button
            onClick=${() => {
              this.page = (this.page + 1) % pages;
              state.update(); // trigger redraw
            }}
            style=${styleString({ backgroundColor: background })}
            .disabled=${perPage >= items.length}
            tabindex="-1"
          >
            &#9755;
          </button>
        </div>
      </div>`);
    }

    return html`<div
      class="grid"
      id=${this.id}
      ref=${this}
      style=${styleString(style)}
    >
      ${result}
    </div>`;
  }
}
componentMap.addMap("grid", Grid);

css`
  .grid {
    display: grid;
    grid-auto-rows: 1fr;
    height: 100%;
    width: 100%;
  }

  .grid button {
    overflow-wrap: normal;
    overflow: hidden;
    border-radius: 5px;
    background-color: inherit;
  }
  .grid button div {
    display: flex;
    height: 100%;
  }
  .grid button figure {
    margin: 2px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    margin-block-start: 0;
    margin-block-end: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;
  }
  .grid button figure figcaption {
    width: 100%;
  }
  .grid button figure img {
    object-fit: contain;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  .grid b {
    color: blue;
  }
  .grid .page-control {
    display: flex;
    flex-direction: column;
  }
  .grid .page-control .text {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .grid .page-control .back-next {
    display: flex;
    flex: 1 1 0;
  }
  .grid .page-control .back-next button {
    flex: 1 1 0;
  }
`;
