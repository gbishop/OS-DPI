import { html } from "uhtml";
import * as Props from "./props";
import { TreeBase } from "./treebase";
import { styleString } from "./style";
import { formatSlottedString } from "./helpers";
import { UpdateAccessData } from "./access";
import "./img-db";
import Globals from "app/globals";
import { comparators } from "app/data";
import "css/grid.css";

class Grid extends TreeBase {
  fillItems = new Props.Boolean(false);
  rows = new Props.Integer(3);
  columns = new Props.Integer(3);
  name = new Props.String("grid");
  background = new Props.Color("white");
  scale = new Props.Float(1);

  allowedChildren = ["GridFilter"];

  /** @type {GridFilter[]} */
  children = [];

  get filters() {
    return this.children.map((child) => ({
      field: child.field.value,
      operator: child.operator.value,
      value: child.value.value,
    }));
  }

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
          <img is="img-db" dbsrc=${item.symbol} title=${item.label || ""} />
          <figcaption>${msg}</figcaption>
        </figure>
      </div>`;
    } else {
      content = msg;
    }
    return html`<button
      tabindex="-1"
      ref=${UpdateAccessData({
        ...item,
        ComponentName: name,
        ComponentType: this.constructor.name,
      })}
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
          ref=${UpdateAccessData({
            ...info,
            name,
            onClick: () => {
              this.page = ((((this.page - 2) % pages) + pages) % pages) + 1;
              state.update(); // trigger redraw
            },
          })}
          tabindex="-1"
        >
          &#9754;</button
        ><button
          .disabled=${this.page == pages}
          ref=${UpdateAccessData({
            ...info,
            name,
            onClick: () => {
              this.page = (this.page % pages) + 1;
              state.update(); // trigger redraw
            },
          })}
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
    let items = data.getMatchingRows(this.filters, state, this.cache);
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
        result.push(this.gridCell(item));
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

    return html`<div class="grid" id=${this.id} style=${styleString(style)}>
      ${result}
    </div>`;
  }
}
TreeBase.register(Grid, "Grid");

export class GridFilter extends TreeBase {
  field = new Props.Field();
  operator = new Props.Select(Object.keys(comparators));
  value = new Props.String("");
}
TreeBase.register(GridFilter, "GridFilter");
