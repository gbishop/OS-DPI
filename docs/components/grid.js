import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";
import { formatSlottedString } from "./helpers.js";
import css from "../_snowpack/pkg/ustyler.js";
import "./img-db.js";

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
  pageBoundaries = {0: 0};  //track starting indices of pages
  /** @type {Object}
   * @property {string} key
   */
  cache = { key: "" };

  template() {
    /** @type {Partial<CSSStyleDeclaration>} */
    const style = {};
    const { data, state, rules } = this.context;
    const { rows, columns, match, name, background } = this.props;
    const tags = state.normalizeTags(this.props.tags);
    const key = tags.join("|");
    /** @type {Rows} */
    let items = data.getTaggedRows(tags, match);
    // reset the page when the key changes
    if (this.cache.key !== key) {
      this.cache.key = key;
      this.page = 0;
    }
    const result = [];
    style.gridTemplate = `repeat(${rows}, calc(100% / ${rows})) / repeat(${columns}, 1fr)`;

    const pageLimit = Math.max(...items.map(item => item.page));  //highest page referenced in content sheet
    let perPage = rows * columns;
    
    let pages = 1;
    if (pageLimit > 1 || items.length > perPage) {
      perPage = rows * columns - 1;
      pages = pageLimit || Math.ceil(items.length / perPage);
    }
    if (this.page >= pages) {
      this.page = 0;
    }

    const pageLen = items.filter(item => item.page == this.page+1).length || perPage; //no. of items on current page
    this.pageBoundaries[this.page+1] = this.pageBoundaries[this.page]+pageLen; //record starting index for next page
    /* Lookup offset value, or calculate it from dimensions if no page field */
    const offset = this.pageBoundaries[this.page] || this.page * perPage;

    /* If items contain page and/or row and column fields,
    sort items accodingly, and let the default 
    behavior of grid take care of the rest */
    if (
      items.some((item) => "page" in item) ||
      (items.some((item) => "row" in item) &&
      items.some((item) => "column" in item))
    ) {
      items.sort(
        (a, b) =>
          (+a.page > +b.page) ||
          (a.page == b.page && +a.row > +b.row) ||
          (a.page == b.page && +a.row == +b.row && +a.column > +b.column) ? 1
          : (a.page == b.page && +a.row == +b.row && +a.column == +b.column) ? 0
          : -1 
      );
    }

    for (let i = offset; i < Math.min(items.length, pageLen + offset); i++) {
      const item = items[i];
      /*Skip entries that are out of bounds of declared grid dimensions*/
      if(+item.row > rows || +item.column > columns)
        continue;
      let itemIndex = offset+((+item.row - 1)*columns + (+item.column-1)) || i;
      while (offset + result.length < itemIndex && itemIndex < offset + perPage) {
        result.push(html`<button tabindex="-1" disabled></button>`);
      }
      let content;
      let msg = formatSlottedString(item.label || "");
      if (item.symbol) {
        content = html`<div>
          <figure>
            <img is="img-db" dbsrc=${item.symbol} title=${item.label || ""} />
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
    if (this.page < pages-1 || perPage < rows * columns) {
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
