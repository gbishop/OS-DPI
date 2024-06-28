import { html } from "uhtml";
import { Functions, updateString } from "app/eval";
import { saveContent } from "app/spreadsheet";
import { fileSave } from "browser-fs-access";
import Globals from "app/globals";
import db from "app/db";

/** Add Notes related functions to Eval for use in Actions
 */

Object.assign(Functions, {
  Notes: (/** @type {string[]} */ ...args) => {
    const result = Globals.data.Notes(args);
    db.write("notes", Globals.data.noteRows);
    return result;
  },
  SaveNotes: () => {
    saveContent("notes", Globals.data.noteRows, "xlsx");
    return "saved";
  },
  /** @param {string} name
   * @param {string} text
   */
  SaveText: (name, text) => {
    const blob = new Blob([text], { type: "text/plain" });
    fileSave(blob, { fileName: name, extensions: [".txt"], id: "osdpi" });
  },

  add_letter: updateString(add_character),

  ClipText: (text = "", length = 100) => {
    const nl_index = text.indexOf("\n");
    if (nl_index > 0 && nl_index < length) length = nl_index;
    return text.slice(0, length);
  },

  Caret: updateString(setCaret),
});

/**
 * insert a character at the index
 * @param {string} old
 * @param {number} index
 * @param {string} char
 * @returns {string}
 */
function insert(old, index, char) {
  if (index < 0) {
    // add it at the end
    return old + char;
  } else {
    // insert it at the index
    return old.slice(0, index) + char + old.slice(index);
  }
}

export const cursor = "\ufeff";

/**
 * Add a keyboard character with backspace and arrow motions simulated
 * by simulating the normal caret with a special character
 * @param {string} old
 * @param {string} char
 * @returns {string}
 */
function add_character(old, char) {
  let index = old.indexOf(cursor);
  let result = old;
  if (char.length == 1) {
    result = insert(old, index, char);
  } else {
    // some special character, handle a few
    switch (char.toLowerCase()) {
      case "enter":
      case "return":
        result = insert(old, index, "\n");
        break;
      case "tab":
        result = insert(old, index, " ");
        break;
      case "backspace":
      case "delete":
        if (index < 0) {
          result = old.slice(0, old.length - 1);
        } else {
          result = old.slice(0, index - 1) + cursor + old.slice(index + 1);
        }
        break;
      case "arrowleft":
        if (index < 0) {
          if (old.length > 0) {
            result =
              old.slice(0, old.length - 1) + cursor + old.slice(old.length - 1);
          } else {
            result = old;
          }
        } else if (index > 0) {
          result =
            old.slice(0, index - 1) +
            cursor +
            old[index - 1] +
            old.slice(index + 1);
        }
        break;
      case "arrowright":
        console.log(index, old.length);
        if (index == old.length - 1) {
          result = old.slice(0, old.length - 1);
        } else if (index >= 0) {
          result =
            old.slice(0, index) +
            old[index + 1] +
            cursor +
            old.slice(index + 2);
        }
        break;
      default:
        result = old;
    }
  }
  if (result[result.length - 1] == cursor) {
    result = result.slice(0, result.length - 1);
  }
  return result;
}

/** @param {string} old
 * @param {string} offset
 */
function setCaret(old, offset) {
  const index = parseInt(offset);
  const clean = old.replace(cursor, "");
  console.log("setCaret", { old, offset, index, clean });
  if (index < 0 || index > clean.length) return clean;
  return clean.slice(0, index) + cursor + clean.slice(index);
}

/**
 * @param {string} text
 * @returns {Hole[]}
 */

export function formatNote(text) {
  const index = text.indexOf(cursor);
  if (index < 0) {
    return [html`<span>${text}</span>`];
  } else {
    return [
      html`<span
        >${text.slice(0, index)}<span class="caret"></span>${text.slice(
          index + 1,
        )}</span
      >`,
    ];
  }
}
