/**
 * Create an object that is persisted to sessionStorage
 *
 * @template {Object} T
 * @param {string} key
 * @param {T} initial
 * @returns {T} - same type as the initial value
 */
export function session(key, initial) {
  // import values from storage if present
  const json = window.sessionStorage.getItem(key);
  if (json) {
    const values = JSON.parse(json);
    if (!(values instanceof Object)) throw TypeError();
    // validate the value from storage
    if (sameObjectShape(initial, values)) initial = values;
  }
  if (!(initial instanceof Object)) throw TypeError();
  return new Proxy(initial, {
    set(obj, prop, value) {
      const r = Reflect.set(obj, prop, value);
      const json = JSON.stringify(obj);
      window.sessionStorage.setItem(key, json);
      return r;
    },
  });
}

/**
 * Compare objects to see if they have the same keys and types
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
function sameObjectShape(a, b) {
  for (const key of Object.keys(a)) {
    if (typeof a[key] !== typeof b[key]) return false;
  }
  return true;
}
