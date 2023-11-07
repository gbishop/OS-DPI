import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { comparators } from "app/data";
import * as Props from "./props";

export class GridFilter extends TreeBase {
  field = new Props.Field({ hiddenLabel: true });
  operator = new Props.Select(Object.keys(comparators), { hiddenLabel: true });
  value = new Props.String("", { hiddenLabel: true });

  /** move my parent instead of me.
   * @param {boolean} up
   */
  moveUpDown(up) {
    this.parent?.moveUpDown(up);
  }

  /** Format the settings
   * @param {GridFilter[]} filters
   * @return {Hole}
   */
  static FilterSettings(filters) {
    const table = [];
    if (filters.length > 0) {
      table.push(html`
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Field</th>
              <th>Operator</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${filters.map(
              (filter, index) => html`
                <tr id=${filter.id + "-settings"}>
                  <td>${index + 1}</td>
                  <td>${filter.field.input()}</td>
                  <td>${filter.operator.input()}</td>
                  <td>${filter.value.input()}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `);
    }
    return html`<fieldset>
      <legend>Filters</legend>
      ${table}
    </fieldset>`;
  }

  /** Convert from Props to values for data module
   * @param {GridFilter[]} filters
   */
  static toContentFilters(filters) {
    return filters.map((child) => ({
      field: child.field.value,
      operator: child.operator.value,
      value: child.value.value,
    }));
  }
}
TreeBase.register(GridFilter, "GridFilter");
