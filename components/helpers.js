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
