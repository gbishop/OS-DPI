import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";
import css from "../_snowpack/pkg/ustyler.js";

class Option extends Base {
  static defaultProps = {
    name: "",
    value: "",
  };
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
   * @arg {string} value
   * @returns {boolean}
   */
  valid(value) {
    const { data, state } = this.context;
    return (
      !this.props.filters.length ||
      data.hasTaggedRows(
        this.props.filters,
        state.clone({ [this.props.stateName]: value })
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
      this.context.state.update({ [name]: value });
    }
  }

  template() {
    const { state } = this.context;
    const stateName = this.props.stateName;
    let current = state.get(stateName);
    const choices = this.children.map((child, index) => {
      const disabled = !this.valid(child.props.value);
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
      >
        ${child.props.name}
      </button>`;
    });

    return html`<div
      class="radio flex"
      onclick=${(/** @type {MouseEvent} */ e) => this.handleClick(e)}
      id=${this.id}
    >
      <fieldset class="flex">
        ${(this.props.label && html`<legend>${this.props.label}</legend>`) ||
        html``}
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
