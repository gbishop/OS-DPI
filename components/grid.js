import { html } from "uhtml";
import * as Props from "./props";
import { TreeBase } from "./treebase";
import { GridFilter } from "./gridFilter";
import { styleString } from "./style";
import { formatSlottedString } from "./helpers";
import Globals from "app/globals";
import "css/grid.css";

/**
 * Return an image or video element given the name + parameters
 * like "foo.mp4 autoplay loop".
 * @param {string} src
 * @param {string} title
 * @param {null|function():void} onload
 * @returns {Hole}
 */
export function imageOrVideo(src, title, onload = null) {
  const match = /(?<src>.*\.(?:mp4|webm))(?<options>.*$)/.exec(src);

  if (match && match.groups) {
    // video
    const options = match.groups.options;
    const vsrc = match.groups.src;
    return html`<video
      is="video-db"
      dbsrc=${vsrc}
      title=${title}
      ?loop=${options.indexOf("loop") >= 0}
      ?autoplay=${options.indexOf("autoplay") >= 0}
      ?muted=${options.indexOf("muted") >= 0}
      onload=${onload}
    />`;
  } else {
    // image
    return html`<img is="img-db" dbsrc=${src} title=${title} />`;
  }
}

class Grid extends TreeBase {
  fillItems = new Props.Boolean(false);
  rows = new Props.Integer(3);
  columns = new Props.Integer(3);
  scale = new Props.Float(1);
  name = new Props.String("grid");
  background = new Props.Color("white");

  allowedChildren = ["GridFilter"];

  /** @type {GridFilter[]} */
  children = [];

  page = 1;
  pageBoundaries = { 0: 0 }; //track starting indices of pages
  /**
   * @type {Object}
   * @property {string} key
   */
  cache = {};

  /** @param {Row} item */
  gridCell(item) {
    const { name } = this.props;
    let content;
    let msg = formatSlottedString(item.label || "");
    if (item.symbol) {
      content = html`<div>
        <figure>
          ${imageOrVideo(item.symbol, item.label || "")}
          <figcaption>${msg}</figcaption>
        </figure>
      </div>`;
    } else {
      content = msg;
    }
    return html`<button
      tabindex="-1"
      .dataset=${{
        ...item,
        ComponentName: name,
        ComponentType: this.className,
      }}
      ?disabled=${!item.label && !item.symbol}
    >
      ${content}
    </button>`;
  }

  emptyCell() {
    return html`<button tabindex="-1" disabled></button>`;
  }

  /**
   * Allow selecting pages in the grid
   *
   * @param {Number} pages
   * @param {Row} info
   */
  pageSelector(pages, info) {
    const { state } = Globals;
    const { background, name } = this.props;

    return html`<div class="page-control">
      <div class="text">Page ${this.page} of ${pages}</div>
      <div class="back-next">
        <button
          style=${styleString({ backgroundColor: background })}
          .disabled=${this.page == 1}
          .dataset=${{
            ...info,
            ComponentName: name,
            ComponentType: this.className,
          }}
          onClick=${() => {
            this.page = ((((this.page - 2) % pages) + pages) % pages) + 1;
            state.update(); // trigger redraw
          }}
          tabindex="-1"
        >
          &#9754;</button
        ><button
          .disabled=${this.page == pages}
          .dataset=${{
            ...info,
            ComponentName: name,
            ComponentType: this.className,
          }}
          onClick=${() => {
            this.page = (this.page % pages) + 1;
            state.update(); // trigger redraw
          }}
          tabindex="-1"
        >
          &#9755;
        </button>
      </div>
    </div>`;
  }

  template() {
    /** @type {Partial<CSSStyleDeclaration>} */
    const style = { backgroundColor: this.props.background };
    const { data, state } = Globals;
    let { rows, columns, fillItems } = this.props;
    /** @type {Rows} */
    let items = data.getMatchingRows(
      GridFilter.toContentFilters(this.children),
      state,
      this.cache,
    );
    // reset the page when the key changes
    if (this.cache.updated) {
      this.page = 1;
    }
    let maxPage = 1;
    const result = [];
    if (!fillItems) {
      // collect the items for the current page
      // and get the dimensions
      let maxRow = 0,
        maxColumn = 0;
      const itemMap = new Map();
      /**
       * @param {number} row
       * @param {number} column
       */
      const itemKey = (row, column) => row * 1000 + column;

      for (const item of items) {
        // ignore items without row and column
        if (!item.row || !item.column) continue;
        // get the max page value if any
        maxPage = Math.max(maxPage, item.page || 1);
        // collect the items on this page
        if (this.page == (item.page || 1)) {
          maxRow = Math.max(maxRow, item.row);
          maxColumn = Math.max(maxColumn, item.column);
          const key = itemKey(item.row, item.column);
          // only use the first one
          if (!itemMap.has(key)) itemMap.set(key, item);
        }
      }
      rows = maxRow;
      columns = maxColumn;
      for (let row = 1; row <= rows; row++) {
        for (let column = 1; column <= columns; column++) {
          if (maxPage > 1 && row == rows && column == columns) {
            // draw the page selector in the last cell
            result.push(this.pageSelector(maxPage, { row, column }));
          } else {
            const key = itemKey(row, column);
            if (itemMap.has(key)) {
              result.push(this.gridCell(itemMap.get(key)));
            } else {
              result.push(this.emptyCell());
            }
          }
        }
      }
    } else {
      // fill items sequentially
      let perPage = rows * columns;
      if (items.length > perPage) {
        perPage = perPage - 1;
      }
      maxPage = Math.ceil(items.length / perPage);
      // get the items on this page
      items = items.slice((this.page - 1) * perPage, this.page * perPage);
      // render them into the result
      for (let i = 0; i < items.length; i++) {
        const row = Math.floor(i / columns) + 1;
        const column = (i % columns) + 1;
        const item = { ...items[i], row, column };
        result.push(this.gridCell({ ...item, row: row, column: column }));
      }
      // fill any spaces that remain
      for (let i = items.length; i < perPage; i++) {
        result.push(this.emptyCell());
      }
      // draw the page selector if needed
      if (maxPage > 1) {
        result.push(this.pageSelector(maxPage, { row: rows, column: columns }));
      }
    }

    style.gridTemplate = `repeat(${rows}, calc(100% / ${rows})) / repeat(${columns}, 1fr)`;

    return this.component({ style }, result);
  }

  /** @returns {Hole|Hole[]} */
  settingsDetails() {
    const props = this.propsAsProps;
    const inputs = Object.values(props).map((prop) => prop.input());
    const filters = GridFilter.FilterSettings(this.children);
    return html`<div>${filters}${inputs}</div>`;
  }

  settingsChildren() {
    return this.empty;
  }
}
TreeBase.register(Grid, "Grid");
