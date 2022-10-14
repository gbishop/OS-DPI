import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import css from "ustyler";
import { UpdateAccessData } from "./access";
import Globals from "../globals";
import { GridFilter } from "./grid";

class Option extends TreeBase {
  name = new Props.String("");
  value = new Props.String("");
  cache = {};
}
TreeBase.register(Option);

class Radio extends TreeBase {
  scale = new Props.Float(1);
  label = new Props.String("");
  stateName = new Props.String("$radio");
  unselected = new Props.Color("lightgray");
  selected = new Props.Color("pink");

  allowedChildren = ["option"];

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
        ref=${UpdateAccessData({
          ComponentType: this.constructor.name,
          name: this.name,
          label: child.props.name,
          onClick: () => state.update({ [stateName]: child.props.value }),
        })}
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
}
TreeBase.register(Radio);

css`
  .radio fieldset {
    flex-flow: wrap;
    border: 0;
    padding: 0;
    margin: 0;
    justify-content: space-around;
    gap: 1%;
  }

  .radio button {
    min-width: 45%;
    max-width: 45%;
  }
`;
