// UHTML.js

import { html as _html } from "uhtml";
export { render } from "uhtml";

const typeMap = new WeakMap();

/**
 * Determines the type of the given argument.
 * Simplified to allow more flexibility with uhtml.
 * 
 * @param {any} arg 
 * @returns {string}
 */
function getTypeOf(arg) {
  const t = typeof arg;
  if (t !== "object") return t;
  if (arg === null) return "null";

  if (Array.isArray(arg)) {
    // Treat all arrays uniformly
    return "Array";
  }

  if (arg.constructor && arg.constructor.name === "Hole") {
    return "Hole";
  }

  return "object";
}

/**
 * Custom html function wrapping uhtml's html.
 * Removed strict null/undefined checks for content nodes.
 * 
 * @param {TemplateStringsArray} strings 
 * @param  {...any} args 
 * @returns {any}
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
    const currentType = getTypeOf(arg);
    const expectedType = types[index];

    if (!string.endsWith("=") && !string.endsWith('="')) {
      // Content node
      if (currentType !== expectedType) {
        // Allow switching between null and undefined
        if (
          (currentType === "null" && expectedType === "undefined") ||
          (currentType === "undefined" && expectedType === "null")
        ) {
          return;
        }

        // Allow switching between Array and "Hole"
        if (
          (currentType === "Array" && expectedType === "Hole") ||
          (currentType === "Hole" && expectedType === "Array")
        ) {
          return;
        }

        // For arrays, ensure consistency in element types if not empty
        if (currentType === "Array" && expectedType === "Array") {
          // Additional checks can be added here if necessary
          return;
        }

        // For other type mismatches, throw an error
        throw new Error(
          `Type of arg after "${string}" changed from ${expectedType} to ${currentType}`
        );
      }
    } else {
      // Attribute
      if (
        currentType !== expectedType &&
        currentType !== "undefined" &&
        expectedType !== "undefined" &&
        currentType !== "null" &&
        expectedType !== "null"
      ) {
        throw new Error(
          `Attribute ${string} changed from ${expectedType} to ${currentType}`
        );
      }
    }
  });

  return _html(strings, ...args);
}

