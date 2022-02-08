/** Implement comparison operators
 * @typedef {function(string, string): boolean} Comparator
 *
 * @type {Object<string, Comparator>}
 */
export const comparators = {
  equals: (f, v) => f == v || f === "*" || v === "*",
  "starts with": (f, v) => f.startsWith(v) || f === "*" || v === "*",
};

/** Test a row with a filter
 * @param {ContentFilter} filter
 * @param {Row} row
 * @param {State} state
 * @returns {boolean}
 */
function match(filter, row, state) {
  const field = row[filter.field.slice(1)] || "";
  let value = filter.value;
  if (value.startsWith("$")) {
    value = state.get(value) || "";
  }
  const comparator = comparators[filter.operator];
  return comparator(field, value);
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
  }

  /**
   * Extract rows with the given tags
   *
   * @param {ContentFilter[]} filters - each filter must return true
   * @param {State} state
   * @return {Rows} Rows with the given tags
   */
  getRows(filters, state) {
    // all the filters must match the row
    const result = this.allrows.filter((row) =>
      filters.every((filter) => match(filter, row, state))
    );
    // console.log("gtr result", result);
    return result;
  }

  /**
   * Test if any rows exist after filtering
   *
   * @param {ContentFilter[]} filters
   * @return {Boolean} true if tag combination occurs
   */
  hasTaggedRows(filters) {
    return this.allrows.some((row) =>
      filters.every((filter) => row.tags.indexOf(tag) >= 0)
    );
  }
}
