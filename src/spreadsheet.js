/**
 * Read array of Rows from a spreadsheet
 *
 * @param {Blob} blob
 * @returns {Promise<Rows>}
 * */
export async function readSheetFromBlob(blob) {
  const XLSX = await import("xlsx");
  const data = await blob.arrayBuffer();
  const workbook = XLSX.read(data, { codepage: 65001 });
  /** @type {Rows} */
  const dataArray = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const ref = sheet["!ref"];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    const names = [];
    const handlers = [];
    const validColumns = [];
    // process the header and choose a handler for each column
    for (let c = range.s.c; c <= range.e.c; c++) {
      let columnName = sheet[XLSX.utils.encode_cell({ r: 0, c })]?.v;
      if (typeof columnName !== "string" || !columnName) {
        continue;
      }
      columnName = columnName.toLowerCase();
      names.push(columnName.trim(" "));
      validColumns.push(c);
      switch (columnName) {
        case "row":
        case "column":
        case "page":
          handlers.push("number");
          break;
        default:
          handlers.push("string");
          break;
      }
    }
    // Process the rows
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      /** @type {Row} */
      const row = { sheetName };
      for (let i = 0; i < validColumns.length; i++) {
        /** @type {string} */
        const name = names[i];
        const c = validColumns[i];
        let value = sheet[XLSX.utils.encode_cell({ r, c })]?.v;
        switch (handlers[i]) {
          case "string":
            if (typeof value === "undefined") {
              value = "";
            }
            if (typeof value !== "string") {
              value = value.toString(10);
            }
            if (value && typeof value === "string") {
              row[name] = value;
            }
            break;
          case "number":
            if (typeof value === "number") {
              row[name] = Math.floor(value);
            } else if (value && typeof value === "string") {
              value = parseInt(value, 10);
              if (isNaN(value)) {
                value = 0;
              }
              row[name] = value;
            }
            break;
        }
      }
      if (Object.keys(row).length > 1) dataArray.push(row);
    }
  }
  return dataArray;
}

/** Save Rows as a spreadsheet
 * @param {string} name
 * @param {Row[]} rows
 * @param {string} type
 */
export async function saveContent(name, rows, type) {
  const XLSX = await import("xlsx");
  const sheetNames = new Set(rows.map((row) => row.sheetName || "sheet1"));
  const workbook = XLSX.utils.book_new();
  for (const sheetName of sheetNames) {
    let sheetRows = rows.filter(
      (row) => sheetName == (row.sheetName || "sheet1"),
    );
    if (type != "csv") {
      sheetRows = sheetRows.map((row) => {
        const { sheetName, ...rest } = row;
        return rest;
      });
    }
    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  XLSX.writeFileXLSX(workbook, `${name}.${type}`);
}
