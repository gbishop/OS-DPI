import { html } from "uhtml";
import { getTaggedRows } from "../data";
import * as rules from "../rules";
import ABase from "./a-base";

/**
 * Convert a message with slots to an html string
 * @param {string} msg - incoming message possibly with markup
 * @return {import('uhtml').Hole[]} - array so uhtml won't escape it
 */
export function removeMarkup(msg) {
  if (!msg) return [];
  const parts = msg.split(/(\$\$.*?\$\$)/);
  return parts.map((part) => {
    const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
    if (m) {
      return html`<b>${m.groups.value}</b>`;
    } else {
      return html`${part}`;
    }
  });
}

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

  template() {
    this.style.flexGrow = this.scale.toString();
    const rows = +this.rows;
    const columns = +this.columns;
    const tags = this.tags;
    const items = getTaggedRows(tags, this.match);
    const result = [];
    this.style.gridTemplate = `repeat(${rows}, calc(100% / ${rows} - 0.5%)) / repeat(${columns}, 1fr)`;

    for (let i = 0; i < Math.min(items.length, rows * columns); i++) {
      const item = items[i];
      let itemIndex = item.index || i;
      while (result.length < itemIndex) {
        result.push(html`<button disabled></button>`);
      }
      let content;
      let msg = removeMarkup(item.msg);
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
    while (result.length < rows * columns) {
      result.push(html`<button disabled></button>`);
    }

    return html`${result}`;
  }
}

customElements.define("a-grid", AGrid);
