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
   * @param {string[]} tags - Tags that must be in each row
   * @param {string} match - how to match
   * @return {Rows} Rows with the given tags
   */
  getTaggedRows(tags, match) {
    let result = [];
    if (match == "contains") {
      // all the tags must be in the row somewhere
      result = this.allrows.filter((row) => {
        return tags.every((tag) => row.tags.indexOf(tag) >= 0);
      });
    } else if (match == "sequence") {
      // all the tags must match those coming from the row in order
      // and any remaining tags in the row must be empty
      result = this.allrows.filter((row) => {
        return (
          tags.every(
            (tag, i) => row.tags[i] == tag || row.tags[i] === "*" || tag === "*"
          ) &&
          row.tags
            .slice(tags.length)
            .every((tag) => tag.length === 0 || tag === "*")
        );
      });
    }
    // console.log("gtr result", result);
    return result;
  }

  /**
   * Test if tagged rows exist
   *
   * @param {string[]} tags - Tags that must be in each row
   * @return {Boolean} true if tag combination occurs
   */
  hasTaggedRows(tags) {
    return this.allrows.some((row) =>
      tags.every((tag) => row.tags.indexOf(tag) >= 0)
    );
  }
}
