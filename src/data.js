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
  contains: (f, v) => f.toLowerCase().includes(v.toLowerCase()),
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
    this.contentRows = [];
    this.dynamicRows = [];
    this.noteRows = [];
    this.groups = ["dynamicRows", "contentRows", "noteRows"];
    /** @type {Set<string>} */
    this.allFields = new Set();
    this.setContent(rows);
  }

  /** @param {Rows} rows - rows coming from the spreadsheet */
  setContent(rows) {
    this.contentRows = (Array.isArray(rows) && rows) || [];
    this.updateAllFields();
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

  /**
   * Add rows of notes
   * @param {Rows} rows
   */
  setNoteRows(rows) {
    if (!Array.isArray(rows)) return;
    this.noteRows = rows;
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
   * Manipulate the Notes rows
   * @param {string[]} args
   * @returns {string} - the id
   */
  Notes(args) {
    /** @param {string} text
     * @param {number} length
     */
    function ClipText(text, length = 100) {
      const nl_index = text.indexOf("\n");
      if (nl_index > 0 && nl_index < length) length = nl_index;
      return text.slice(0, length);
    }
    if (args.length % 2 != 0) {
      console.error("number of args must be multiple of 2");
      return "";
    }
    /** @type {Object<string,string>} */
    const note = {};
    for (let i = 0; i < args.length; i += 2) {
      const field = args[i + 0];
      if (!field.match(/^#\w+$/)) {
        console.error("bad field", field);
        return "";
      }
      const value = args[i + 1];
      note[field.slice(1)] = value;
    }
    note["sheetName"] = "Notes";
    let ID = note["ID"];
    if (ID) {
      if (!note["label"] && note["text"]) {
        note["label"] = ClipText(note["text"]);
      }
      const index = this.noteRows.findIndex((row) => row.ID == ID);
      if (index >= 0) {
        Object.assign(this.noteRows[index], note);
      } else {
        console.error("note not found");
        return "";
      }
    } else if (note.DELETE) {
      const index = this.noteRows.findIndex((row) => row.ID == note.DELETE);
      if (index >= 0) {
        this.noteRows.splice(index, 1);
        return "";
      } else {
        console.error("delete id not found");
        return "";
      }
    } else {
      ID = new Date().toISOString();
      note["ID"] = ID;
      if (!note["label"] && note["text"]) {
        note["label"] = ClipText(note["text"]);
      }
      this.noteRows.push(note);
    }
    return ID;
  }
}
