import { html } from "uhtml";

/**
 * Copy properties from HTML into the element. Only accept
 * properties that already exist
 * @param {HTMLElement} element
 * @returns {void}
 */
export function copyProps(element) {
  for (const name of Object.getOwnPropertyNames(element)) {
    let value = element.getAttribute(name);
    if (value !== null) {
      if (typeof element[name] == "number") {
        element[name] = +element.getAttribute(name);
      } else {
        element[name] = element.getAttribute(name);
      }
    }
  }
}

/**
 * Edit slots markup to replace with values
 * @param {string} msg - the string possibly containing $$ kind = value $$ markup
 * @param {string[]} slotValues - values to replace slots
 * @returns {import('uhtml').Hole[]} - formatted string
 */
export function formatSlottedString(msg, slotValues = []) {
  let slotIndex = 0;
  console.log("fss", msg, slotValues);
  msg = msg || "";
  return msg.split(/(\$\$.*?\$\$)/).map((part) => {
    const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
    if (m) {
      return html`<b>${slotValues[slotIndex++] || m.groups.value}</b>`;
    } else {
      return html`${part}`;
    }
  });
}
