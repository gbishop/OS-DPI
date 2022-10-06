import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";
import css from "ustyler";
import { UpdateAccessData } from "./access";
import Globals from "../globals";

class Option extends Base {
  static defaultProps = {
    name: "",
    value: "",
  };
  cache = {};
}
componentMap.addMap("option", Option);

class Radio extends Base {
  static defaultProps = {
    label: "",
    stateName: "$radio",
    filters: [],
    unselected: "lightgray",
    selected: "pink",
    scale: "1",
  };
  static allowedChildren = ["option"];

  /**
   * true if there exist rows with the this.filters and the value
   * @arg {Option} option
   * @returns {boolean}
   */
  valid(option) {
    const { data, state } = Globals;
    return (
      !this.props.filters.length ||
      data.hasMatchingRows(
        this.props.filters,
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
    const choices = this.children.map((child, index) => {
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
          component: this.constructor.name,
          name: this.name,
          label: child.props.name,
          onClick: (e) => state.update({ [stateName]: child.props.value }),
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

componentMap.addMap("radio", Radio);

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
