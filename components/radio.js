import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/radio.css";
import Globals from "app/globals";
import { GridFilter } from "./grid";

class Option extends TreeBase {
  name = new Props.String("");
  value = new Props.String("");
  cache = {};
}
TreeBase.register(Option, "Option");

class Radio extends TreeBase {
  scale = new Props.Float(1);
  label = new Props.String("");
  stateName = new Props.String("$radio");
  unselected = new Props.Color("lightgray");
  selected = new Props.Color("pink");

  allowedChildren = ["Option", "GridFilter"];

  /** @type {(Option | GridFilter)[]} */
  children = [];

  get filters() {
    return this.filterChildren(GridFilter).map((child) => ({
      field: child.field.value,
      operator: child.operator.value,
      value: child.value.value,
    }));
  }

  get options() {
    return this.filterChildren(Option);
  }

  /**
   * true if there exist rows with the this.filters and the value
   * @arg {Option} option
   * @returns {boolean}
   */
  valid(option) {
    const { data, state } = Globals;
    const filters = this.filters;
    return (
      !filters.length ||
      data.hasMatchingRows(
        filters,
        state.clone({ [this.props.stateName]: option.props.value }),
        option.cache
      )
    );
  }

  /**
   * handle clicks on the chooser
   * @param {MouseEvent} event
   */
  handleClick({ target }) {
    if (target instanceof HTMLButtonElement) {
      const value = target.value;
      const name = this.props.stateName;
      Globals.state.update({ [name]: value });
    }
  }

  template() {
    const { state } = Globals;
    const stateName = this.props.stateName;
    let current = state.get(stateName);
    const choices = this.options.map((child, index) => {
      const disabled = !this.valid(/** @type {Option}*/ (child));
      if (stateName && !current && !disabled && child.props.value) {
        current = child.props.value;
        state.update({ [stateName]: current });
      }
      const color =
        child.props.value == current || (!current && index == 0)
          ? this.props.selected
          : this.props.unselected;
      return html`<button
        style=${styleString({ backgroundColor: color })}
        value=${child.props.value}
        ?disabled=${disabled}
        .dataset=${{
          ComponentType: this.className,
          ComponentName: this.name,
          label: child.props.name,
        }}
        click
        onClick=${() => state.update({ [stateName]: child.props.value })}
      >
        ${child.props.name}
      </button>`;
    });

    return html`<div class="radio flex" id=${this.id}>
      <fieldset class="flex">
        ${(this.props.label && html`<legend>${this.props.label}</legend>`) ||
        html`<!--empty-->`}
        ${choices}
      </fieldset>
    </div>`;
  }

  get name() {
    return this.props.name || this.props.label || this.props.stateName;
  }

  settingsDetails() {
    const props = this.propsAsProps;
    const inputs = Object.values(props).map((prop) => prop.input());
    const filters = this.filterChildren(GridFilter);
    const editFilters = !filters.length
      ? html`<!--empty-->`
      : html`<fieldset>
          <legend>Filters</legend>
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
                  <tr>
                    <td>${index + 1}</td>
                    <td>${filter.field.input()}</td>
                    <td>${filter.operator.input()}</td>
                    <td>${filter.value.input()}</td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </fieldset>`;
    const options = this.filterChildren(Option);
    const editOptions = html`<fieldset>
      <legend>Options</legend>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${options.map(
            (option, index) => html`
              <tr>
                <td>${index + 1}</td>
                <td>${option.name.input()}</td>
                <td>${option.value.input()}</td>
              </tr>
            `
          )}
        </tbody>
      </table>
    </fieldset>`;
    return html`<div>${editFilters}${editOptions}${inputs}</div>`;
  }

  settingsChildren() {
    return html``;
  }
}
TreeBase.register(Radio, "Radio");
