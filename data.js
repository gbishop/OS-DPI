import { evalInContext } from "./eval";

/** Implement comparison operators
 * @typedef {function(string, string): boolean} Comparator
 *
 * @type {Object<string, Comparator>}
 */
export const comparators = {
  equals: (f, v) =>
    f.localeCompare(v, undefined, { sensitivity: "base" }) === 0 ||
    f === "*" ||
    v === "*",
  "starts with": (f, v) =>
    f.toUpperCase().startsWith(v.toUpperCase()) || f === "*" || v === "*",
};

/** Test a row with a filter
 * @param {ContentFilter} filter
 * @param {Row} row
 * @returns {boolean}
 */
function match(filter, row) {
  const field = row[filter.field.slice(1)] || "";
  let value = filter.value;
  const comparator = comparators[filter.operator];
  let r = comparator(field, value);
  return r;
}

export class Data {
  /** @param {Rows} rows */
  constructor(rows) {
    this.allrows = (Array.isArray(rows) && rows) || [];
    this.allFields = rows.reduce(
      (previous, current) =>
        Array.from(
          new Set([
            ...previous,
            ...Object.keys(current).map((field) => "#" + field),
          ])
        ),
      []
    );
    this.loadTime = new Date();
  }

  /**
   * Extract rows with the given tags
   *
   * @param {ContentFilter[]} filters - each filter must return true
   * @param {State} state
   * @param {RowCache} [cache]
   * @return {Rows} Rows that pass the filters
   */
  getRows(filters, state, cache) {
    // all the filters must match the row
    const boundFilters = filters.map((filter) =>
      Object.assign({}, filter, {
        value: evalInContext(filter.value, { state }),
      })
    );
    if (cache) {
      const newKey = JSON.stringify(boundFilters);
      if (cache.key == newKey && cache.loadTime == this.loadTime) {
        cache.updated = false;
        return cache.rows;
      }
      cache.key = newKey;
    }
    const result = this.allrows.filter((row) =>
      boundFilters.every((filter) => match(filter, row))
    );
    if (cache) {
      cache.rows = result;
      cache.updated = true;
      cache.loadTime = this.loadTime;
    }
    // console.log("gtr result", result);
    return result;
  }

  /**
   * Test if any rows exist after filtering
   *
   * @param {ContentFilter[]} filters
   * @param {State} state
   * @return {Boolean} true if tag combination occurs
   */
  hasTaggedRows(filters, state) {
    const boundFilters = filters.map((filter) =>
      Object.assign({}, filter, {
        value: evalInContext(filter.value, { state }),
      })
    );
    const result = this.allrows.some((row) =>
      boundFilters.every((filter) => match(filter, row))
    );
    return result;
  }
}
