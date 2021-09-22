import { html } from "uhtml";
import { getTaggedRows, normalizeTags } from "../data";
import * as rules from "../rules";
import ABase from "./a-base";
import { formatSlottedString } from "./helpers";
import { state } from "../state";

class AGrid extends ABase {
  // set the defaults
  tags = "";
  rows = 1;
  columns = 1;
  scale = 1;
  background = "inherit";
  match = "contains";
  name = "a-grid";

  static observed = "tags rows columns scale background match name";

  init() {
    state.observe(
      this,
      ...this.tags.split(" ").filter((tag) => tag.startsWith("$"))
    );
    this.page = 0;
    this.cache = { key: "", items: [] };
  }

  template() {
    this.style.flexGrow = this.scale.toString();
    const rows = +this.rows;
    const columns = +this.columns;
    const tags = this.tags;
    const key = normalizeTags(tags).join("|");
    let items;
    if (
      key.length &&
      this.cache.key.length &&
      this.cache.items.length &&
      this.cache.key === key
    ) {
      items = this.cache.items;
    } else {
      items = getTaggedRows(tags, this.match);
      this.cache.items = items;
      this.cache.key = key;
      this.page = 0;
    }
    const result = [];
    this.style.gridTemplate = `repeat(${rows}, calc(100% / ${rows} - 0.5%)) / repeat(${columns}, 1fr)`;

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
          onClick=${rules.handler(this.name, item, "press")}
          style=${`background-color: ${this.background}`}
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
              this.render();
            }}
            style=${`background-color: ${this.background}`}
            .disabled=${perPage >= items.length}
          >
            &#9754;</button
          ><button
            onClick=${() => {
              this.page = (this.page + 1) % pages;
              this.render();
            }}
            style=${`background-color: ${this.background}`}
            .disabled=${perPage >= items.length}
          >
            &#9755;
          </button>
        </div>
      </div>`);
    }
    return html`${result}`;
  }
}

customElements.define("a-grid", AGrid);
