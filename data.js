import { state } from "./state.js";

/** @typedef {Object[]} Data
 * @property {string} [msg]
 * @property {string} [label]
 * @property {string[]} tags
 * @property {string} [link]
 * @property {string} [topic]
 * @property {string} [icon]
 * @property {string} [symbol]
 * @property {number} [index]
 * @property {Object} [details]
 * */

/** @type {Data} allrows */
let allrows = [];

/** Load data from json file
 * @param {string} name
 */
export async function loadData(name) {
  const resp = await fetch(name);
  allrows = await resp.json();
}

/**
 * Extract rows with the given tags
 *
 * @param {string|string[]} tagsStringOrArray - Tags that must be in each row
 * @return {string[]} normalized tags as an array
 */
export function normalizeTags(tagsStringOrArray) {
  /** @type {string[]} tags */
  var tags = [];
  if (typeof tagsStringOrArray === "string") {
    // convert to array
    tags = tagsStringOrArray.split(" ").filter((t) => t);
    // console.log("nt", tags);
  }
  // normalize
  tags = tags.map((t) => state.interpolate(t)).filter((t) => t.length);
  return tags;
}

/**
 * Extract rows with the given tags
 *
 * @param {string|string[]} tagsStringOrArray - Tags that must be in each row
 * @param {string} match - how to match
 * @return {Data} Rows with the given tags
 */
export function getTaggedRows(tagsStringOrArray, match) {
  const tags = normalizeTags(tagsStringOrArray);
  // console.log("gtr", tags, allrows.length);
  let result = [];
  if (match == "contains") {
    result = allrows.filter((row) => {
      return tags.every((tag) => row.tags.indexOf(tag) >= 0);
    });
  } else if (match == "sequence") {
    result = allrows.filter((row) => {
      return (
        tags.length == row.tags.length &&
        tags.every((tag, i) => row.tags[i] == tag)
      );
    });
  }
  // console.log("gtr result", result);
  return result;
}

/**
 * Test if tagged rows exist
 *
 * @param {string|string[]} tagsStringOrArray - Tags that must be in each row
 * @return {Boolean} true if tag combination occurs
 */
export function hasTaggedRows(tagsStringOrArray) {
  const tags = normalizeTags(tagsStringOrArray);
  return allrows.some((row) => tags.every((tag) => row.tags.indexOf(tag) >= 0));
}
