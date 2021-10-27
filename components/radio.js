import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

class Option extends Base {
  static defaultProps = {
    name: "",
    value: "",
  };
}
componentMap.addMap("option", Option);

class Radio extends Base {
  /** @type {Props} */
  static defaultProps = {
    label: "",
    stateName: "",
    unselected: "lightgray",
    selected: "pink",
    scale: "1",
    tags: [],
  };
  static allowedChildren = ["option"];

  /**
   * true if there exist rows with the this.tags and the value
   * @arg {string} value
   * @returns {boolean}
   */
  valid(value) {
    const { data, state } = this.context;
    return (
      !this.props.tags.length ||
      data.hasTaggedRows(state.normalizeTags([...this.props.tags, value]))
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
    const style = { flexGrow: this.props.scale };
    const stateName = this.props.stateName;
    let current = state.get(stateName);
    const choices = this.children.map((child, index) => {
      const disabled = !this.valid(child.props.value);
      if (!current && !disabled) {
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
      style=${styleString(style)}
      onclick=${(/** @type {MouseEvent} */ e) => this.handleClick(e)}
      id=${this.id}
    >
      <fieldset class="flex">
        ${(this.props.label && html`<legend>${this.props.label}</legend>`) ||
        null}
        ${choices}
      </fieldset>
    </div>`;
  }

  get name() {
    return this.props.name || this.props.label || this.props.stateName;
  }
}

componentMap.addMap("radio", Radio);
