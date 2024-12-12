import { html as _html } from "uhtml";

export { render } from "uhtml";

const typeMap = new WeakMap();

/** @param {TemplateStringsArray} strings
 * @param {any[]} args
 */
export function html(strings, ...args) {
  let types = typeMap.get(strings);
  if (!types) {
    types = args.map((arg) => getTypeOf(arg));
    typeMap.set(strings, types);
  }

  if (!strings[0].match(/\s*</)) {
    throw new Error(`html does not begin with < ${strings[0]}`);
  }

  args.forEach((arg, index) => {
    const string = strings[index];
    if (!string.endsWith("=") && !string.endsWith('="')) {
      // must be a content node
      if (arg === null) {
        throw new Error(`html arg after ${string} is null`);
      }
      if (arg === undefined) {
        throw new Error(`html arg after ${string} is undefined`);
      }
      const atype = getTypeOf(arg);
      if (atype != types[index]) {
        const t = types[index];
        if (
          !atype.startsWith("Array") ||
          !t.startsWith("Array") ||
          !(atype.endsWith("empty") || t.endsWith("empty"))
        )
          throw new Error(
            `type of arg after ${string} changed from ${types[index]} to ${atype}`,
          );
      }
    } else {
      // must be an attribute
      const atype = getTypeOf(arg);
      if (
        atype != types[index] &&
        atype != "undefined" &&
        types[index] != "undefined" &&
        atype != "null" &&
        types[index] != "null"
      ) {
        throw new Error(
          `attribute ${string} changed from ${types[index]} to ${atype}`,
        );
      }
    }
  });
  return _html(strings, ...args);
}

/** @param {any} arg
 * @returns {string} */
function getTypeOf(arg) {
  const t = typeof arg;
  if (t != "object") return t;
  if (arg == null) return "null";

  if (Array.isArray(arg)) {
    if (arg.length) {
      const ts = arg.map((a) => getTypeOf(a));
      if (!ts.every((t) => t == t[0])) {
        return `Array of ${ts[0]}`;
      } else {
        console.error("array", ts);
        throw new Error("Array elements of different types");
      }
    } else return `Array empty`;
  }
  if (arg.constructor.name == "Hole") {
    return "Hole";
  }
  return "object";
}
