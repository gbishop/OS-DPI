import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";
import { formatSlottedString } from "./helpers";

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
  cache = { key: "", items: [] };

  template() {
    const style = {
      flexGrow: this.props.scale,
    };
    const { data, state, rules } = this.context;
    const { rows, columns, match, name, background } = this.props;
    const tags = state.normalizeTags(this.props.tags);
    const key = tags.join("|");
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
      let itemIndex = item.index || i;
      while (offset + result.length < itemIndex) {
        result.push(html`<button disabled></button>`);
      }
      let content;
      let msg = formatSlottedString(item.msg);
      if ("symbol" in item) {
        content = html`<div>
          <figure>
            <img src=${item.symbol} title=${item.icon} />
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
          .disabled=${!item.msg || item.msg.length == 0}
        >
          ${content}
        </button>`
      );
    }
    while (result.length < perPage) {
      result.push(html`<button disabled></button>`);
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
          >
            &#9754;</button
          ><button
            onClick=${() => {
              this.page = (this.page + 1) % pages;
              state.update(); // trigger redraw
            }}
            style=${styleString({ backgroundColor: background })}
            .disabled=${perPage >= items.length}
          >
            &#9755;
          </button>
        </div>
      </div>`);
    }

    return html`<div class="grid" ref=${this} style=${styleString(style)}>
      ${result}
    </div>`;
  }
}
componentMap.addMap("grid", Grid);
