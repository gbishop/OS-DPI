import { GridFilter } from "components/gridFilter";

const collator = new Intl.Collator("en", { sensitivity: "base" });
const collatorNumber = new Intl.Collator("en", { numeric: true });

/** Implement comparison operators
 * @typedef {function(string, string): boolean} Comparator
 *
 * @type {Object<string, Comparator>}
 */
export const comparators = {
  equals: (f, v) => collator.compare(f, v) === 0 || f === "*" || v === "*",
  "starts with": (f, v) => f.toUpperCase().startsWith(v.toUpperCase()),
  empty: (f) => !f,
  "not empty": (f) => !!f,
  "less than": (f, v) => collatorNumber.compare(f, v) < 0,
  "greater than": (f, v) => collatorNumber.compare(f, v) > 0,
  "less or equal": (f, v) => collatorNumber.compare(f, v) <= 0,
  "greater or equal": (f, v) => collatorNumber.compare(f, v) >= 0,
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

const testRows = [];
for (let i = 0; i < 10; i++) {
  testRows.push({ label: "" + i });
}

export class Data {
  /** @param {Rows} rows - rows coming from the spreadsheet */
  constructor(rows) {
    this.contentRows = (Array.isArray(rows) && rows) || [];
    this.dynamicRows = [];
    this.noteRows = [];
    this.groups = ["dynamicRows", "contentRows", "noteRows"];
    /** @type {Set<string>} */
    this.allFields = new Set();
    this.updateAllFields();
  }

  get length() {
    let result = 0;
    for (const group of this.groups) {
      result += this[group].length;
    }
    return result;
  }

  updateAllFields() {
    /** @type {Set<string>} */
    const allFields = new Set();
    for (const group of this.groups) {
      for (const row of this[group]) {
        for (const field of Object.keys(row)) {
          allFields.add("#" + field);
        }
      }
    }
    this.allFields = allFields;
    this.clearFields = {};
    for (const field of this.allFields) {
      this.clearFields[field.slice(1)] = null;
    }
  }

  /**
   * Extract rows with the given filters
   *
   * @param {GridFilter[]} filters - each filter must return true
   * @param {boolean} [clearFields] - return null for undefined fields
   * @return {Rows} Rows that pass the filters
   */
  getMatchingRows(filters, clearFields = true) {
    // all the filters must match the row
    const boundFilters = filters.map((filter) => ({
      field: filter.field.value,
      operator: filter.operator.value,
      value: filter.value.value,
    }));
    let result = [];
    for (const group of this.groups) {
      for (const row of this[group]) {
        if (boundFilters.every((filter) => match(filter, row))) {
          result.push(row);
        }
      }
    }
    if (clearFields)
      result = result.map((row) => ({ ...this.clearFields, ...row }));
    return result;
  }

  /**
   * Test if any rows exist after filtering
   *
   * @param {GridFilter[]} filters
   * @param {EvalContext} context
   * @return {Boolean} true if tag combination occurs
   */
  hasMatchingRows(filters, context) {
    const boundFilters = filters.map((filter) => ({
      field: filter.field.value,
      operator: filter.operator.value,
      value: filter.value.valueInContext(context),
    }));
    for (const group of this.groups) {
      for (const row of this[group]) {
        if (boundFilters.every((filter) => match(filter, row))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Add rows from the socket interface
   * @param {Rows} rows
   */
  setDynamicRows(rows) {
    if (!Array.isArray(rows)) return;
    this.dynamicRows = rows;
    this.updateAllFields();
  }
}
