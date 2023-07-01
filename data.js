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
  "less than": (f, v) => f.localeCompare(v, undefined, { numeric: true }) < 0,
  "starts with": (f, v) =>
    f.toUpperCase().startsWith(v.toUpperCase()) || f === "*" || v === "*",
  empty: (f) => !f,
  "not empty": (f) => !!f,
};

/** Test a row with a filter
 * @param {ContentFilter} filter
 * @param {Row} row
 * @returns {boolean}
 */
function match(filter, row) {
  const field = row[filter.field.slice(1)] || "";
  let value = filter.value || "";
  const comparator = comparators[filter.operator];
  if (!comparator) return true;
  let r = comparator(field.toString(), value.toString());
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
    this.clearFields = Object.fromEntries(
      this.allFields.map((field) => [field.slice(1), null])
    );
    this.loadTime = new Date();
  }

  /**
   * Extract rows with the given filters
   *
   * @param {ContentFilter[]} filters - each filter must return true
   * @param {State} state
   * @param {RowCache} [cache]
   * @return {Rows} Rows that pass the filters
   */
  getMatchingRows(filters, state, cache) {
    // all the filters must match the row
    const boundFilters = filters.map((filter) =>
      Object.assign({}, filter, {
        value: evalInContext(filter.value, { state }),
      })
    );
    if (cache) {
      const newKey = JSON.stringify(boundFilters);
      if (
        cache.key == newKey &&
        cache.loadTime == this.loadTime &&
        cache.rows
      ) {
        cache.updated = false;
        return cache.rows;
      }
      cache.key = newKey;
    }
    const result = this.allrows
      .filter((row) => boundFilters.every((filter) => match(filter, row)))
      .map((row) => ({ ...this.clearFields, ...row }));
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
   * @param {RowCache} [cache]
   * @return {Boolean} true if tag combination occurs
   */
  hasMatchingRows(filters, state, cache) {
    const boundFilters = filters.map((filter) =>
      Object.assign({}, filter, {
        value: evalInContext(filter.value, { state }),
      })
    );
    if (cache) {
      const newKey = JSON.stringify(boundFilters);
      if (
        cache.key == newKey &&
        cache.loadTime == this.loadTime &&
        cache.result
      ) {
        cache.updated = false;
        return cache.result;
      }
      cache.key = newKey;
    }
    const result = this.allrows.some((row) =>
      boundFilters.every((filter) => match(filter, row))
    );
    if (cache) {
      cache.result = result;
      cache.updated = true;
      cache.loadTime = this.loadTime;
    }
    return result;
  }
}
