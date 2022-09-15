import { html } from "uhtml";
import { validateColor, getColor } from "./style";
import { textInput } from "./input";
import { log } from "../log";
import { comparators } from "../data";
import { validateExpression } from "../eval";
import css from "ustyler";
import Globals from "../globals";

/**
 * @param {Tree} component
 * @param {string} name
 * @param {any} value
 * @param {PropertyInfo} info
 * @param {(name: string, value: any) => void} hook
 */
export function propEditor(component, name, value, info, hook) {
  function propUpdate({ target }) {
    const name = target.name;
    const value = target.value;
    hook(name, value);
  }
  const label = html`<label for=${name}>${info.name}</label>`;
  const help = `${component.constructor.name}#${info.name
    .toLowerCase()
    .replace(" ", "-")}`;
  switch (info.type) {
    case "string":
      return html`<label for=${name}>${info.name}</label>
        <input
          type="text"
          id=${name}
          name=${name}
          .value=${value}
          help=${help}
          onchange=${propUpdate}
          autocomplete="off"
          ?disabled=${info.disabled && info.disabled(component.props)}
        />`;

    case "number":
      return html`${label}
        <input
          type="number"
          id=${name}
          name=${name}
          .value=${value}
          step=${info.step || 1}
          min=${info.min}
          max=${info.max}
          help=${help}
          onchange=${propUpdate}
          autocomplete="off"
          ?disabled=${info.disabled && info.disabled(component.props)}
        />`;

    case "color":
      return html`<label for=${name}>${info.name}</label>
        <div class="color-input">
          <input
            id=${name}
            type="text"
            name=${name}
            .value=${value}
            list="ColorNames"
            help=${help}
            onchange=${(/** @type {InputEventWithTarget} */ event) =>
              validateColor(event) && propUpdate(event)}
            autocomplete="off"
            ?disabled=${info.disabled && info.disabled(component.props)}
          />
          <div
            class="swatch"
            style=${`background-color: ${getColor(value)}`}
          ></div>
        </div>`;

    case "select":
      return html`<label for=${name}>${info.name}</label>
        <select
          id=${name}
          name=${name}
          onchange=${propUpdate}
          help=${help}
          ?disabled=${info.disabled && info.disabled(component.props)}
        >
          ${(info.values &&
            Object.keys(info.values).map(
              (opt) =>
                html`<option value=${opt} ?selected=${opt == value}>
                  ${info.values[opt]}
                </option>`
            )) ||
          html``}
        </select>`;

    case "checkbox":
      return html`<label for=${name}>${info.name}</label>
        <input
          type="checkbox"
          id=${name}
          name=${name}
          .checked=${value}
          help=${help}
          onchange=${(e) => hook(name, e.target.checked)}
        />`;

    case "state":
      const { tree, rules } = Globals;
      let states = new Set([...tree.allStates(), ...rules.allStates()]);
      return textInput({
        type: "text",
        name,
        label: info.name,
        value,
        help,
        validate: (value) => (value.match(/^\$\w+$/) ? "" : "Invalid state"),
        update: hook,
        suggestions: states,
      });

    case "filters":
      return editFilters(component, name, value, info, hook);

    case "voiceURI":
      return html`<label for=${name}>${info.name}</label>
        <select
          is="select-voice"
          id=${name}
          name=${name}
          help=${help}
          onchange=${propUpdate}
          value=${value}
          ?disabled=${info.disabled && info.disabled(component.props)}
        >
          <option value="">Default</option>
        </select>`;

    default:
      log("tbd", name);
      return html`<p>${name}</p>`;
  }
}

/**
 * @param {Tree} component
 * @param {string} name
 * @param {any} value
 * @param {PropertyInfo} info
 * @param {(name: string, value: any) => void} hook
 */
function editFilters(component, name, value, info, hook) {
  if (!component.designer.filters) {
    component.designer.filters = [...value];
  }
  /** @type {ContentFilter[]} */
  const filters = component.designer.filters;
  function reflect() {
    const result = filters.filter(validFilter);
    hook(name, result);
  }
  /** @param {ContentFilter} filter */
  function validFilter(filter) {
    return (
      filter.field.match(/^#\w+$/) &&
      filter.operator in comparators &&
      filter.value.match(/\$\w+$|[^$].*/)
    );
  }
  const { tree, rules, data } = Globals;
  const allStates = new Set([...tree.allStates(), ...rules.allStates()]);
  const allFields = new Set(data.allFields);
  const both = new Set([...allStates, ...allFields]);
  const filterRows = filters.map((filter, index) => {
    const fieldInput = html`<select
      class="field"
      onChange=${(event) => {
        filters[index].field = event.target.value;
        reflect();
      }}
    >
      <option value="">Choose a field</option>
      ${data.allFields.map(
        (fieldName) =>
          html`<option
            value=${fieldName}
            ?selected=${fieldName == filter.field}
          >
            ${fieldName}
          </option>`
      )}
    </select>`;
    const opInput = html`<select
      class="operator"
      onChange=${(event) => {
        filters[index].operator = event.target.value;
        reflect();
      }}
    >
      ${Object.keys(comparators).map(
        (op) =>
          html`<option value=${op} ?selected=${op == filter.operator}>
            ${op}
          </option>`
      )}
    </select>`;
    const valueInput = textInput({
      type: "text",
      className: "value",
      name: "value",
      label: "",
      labelHidden: true,
      value: filter.value,
      suggestions: allStates,
      validate: (value) =>
        value.length == 0 || validateExpression(value) ? "" : "Invalid value",
      update: (_, value) => {
        filters[index].value = value;
        reflect();
      },
    });
    return html`<tr>
      <td>${index + 1}</td>
      <td>${fieldInput}</td>
      <td>${opInput}</td>
      <td>${valueInput}</td>
      <td>
        <button
          title="Delete filter"
          onclick=${() => {
            filters.splice(index, 1);
            reflect();
          }}
        >
          X
        </button>
      </td>
    </tr>`;
  });
  let filterTable = html``;
  if (filters.length > 0) {
    filterTable = html`<table>
      <thead>
        <tr>
          <th>#</th>
          <th>Field</th>
          <th>Operator</th>
          <th>Value</th>
          <th>X</th>
        </tr>
      </thead>
      <tbody>
        ${filterRows}
      </tbody>
    </table>`;
  }
  return html`<fieldset help="Layout#filters">
    <legend>Filters</legend>
    ${filterTable}
    <button
      style="grid-column: 1/4"
      onclick=${() => {
        filters.push({ field: "", operator: "equals", value: "" });
        reflect();
      }}
    >
      Add filter
    </button>
  </fieldset>`;
}

css`
  div.props {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 0.25em 1em;
    border: 1px solid black;
    padding: 1em;
  }

  div.props label {
    grid-column: 1 / 2;
    text-align: right;
  }

  div.props input,
  div.props color-input,
  div.props button {
    grid-column: 2 / 3;
  }

  div.props fieldset {
    grid-column: 1 / 3;
    display: grid;
    grid-template-columns: auto auto auto auto auto;
  }

  div.props fieldset .field {
    grid-column: 1 / 2;
  }
  div.props fieldset .operator {
    grid-column: 2 / 3;
  }
  div.props fieldset .value {
    grid-column: 3 / 4;
  }
  div.props fieldset button {
    grid-column: 4 / 5;
  }

  input[type="number"] {
    width: 3em;
  }

  select option[disabled] {
    display: none;
  }

  .color-input {
    margin-right: 1em;
    align-items: center;
  }

  .color-input input {
    flex: 1 1 0;
    margin-right: 0.2em;
  }

  .color-input .swatch {
    width: 1em;
    height: 1em;
    display: inline-block;
    border: 1px solid black;
  }
  input:invalid {
    background-color: #fcc;
    border-color: red;
  }

  select#itemPlacement[value="row column from content"] ~ input#rows {
    display: none;
  }
`;
