import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/radio.css";
import Globals from "app/globals";
import { GridFilter } from "./gridFilter";

class Option extends TreeBase {
  name = new Props.String("", { hiddenLabel: true });
  value = new Props.String("", { hiddenLabel: true });
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

  get options() {
    return this.filterChildren(Option);
  }

  /**
   * true if there exist rows with the this.filters and the value
   * @arg {Option} option
   * @returns {boolean}
   */
  valid(option) {
    const { data } = Globals;
    const filters = this.filterChildren(GridFilter);
    return (
      !filters.length ||
      data.hasMatchingRows(filters, {
        states: {
          [this.stateName.value]: option.value.value,
        },
      })
    );
  }

  /**
   * handle clicks on the chooser
   * @param {MouseEvent} event
   */
  handleClick({ target }) {
    if (target instanceof HTMLButtonElement) {
      const value = target.value;
      const name = this.stateName.value;
      Globals.state.update({ [name]: value });
    }
  }

  template() {
    const { state } = Globals;
    const stateName = this.stateName.value;
    const selected = this.selected.value;
    const unselected = this.unselected.value;
    const radioLabel = this.label.value;
    let currentValue = state.get(stateName);
    const choices = this.options.map((choice, index) => {
      const choiceDisabled = !this.valid(choice);
      const choiceValue = choice.value.value;
      const choiceName = choice.name.value;
      if (stateName && !currentValue && !choiceDisabled && choiceValue) {
        currentValue = choiceValue;
        state.define(stateName, choiceValue);
      }
      const color =
        choiceValue == currentValue || (!currentValue && index == 0)
          ? selected
          : unselected;
      return html`<button
        style=${styleString({ backgroundColor: color })}
        value=${choiceValue}
        ?disabled=${choiceDisabled}
        .dataset=${{
          ComponentType: this.className,
          ComponentName: radioLabel || stateName,
          label: choiceName,
        }}
        click
        @Activate=${() => state.update({ [stateName]: choice.value.value })}
      >
        ${choiceName}
      </button>`;
    });

    return this.component(
      {},
      html`<fieldset class="flex">
        ${(radioLabel && [html`<legend>${radioLabel}</legend>`]) || []}
        ${choices}
      </fieldset>`,
    );
  }

  settingsDetails() {
    const props = this.props;
    const inputs = Object.values(props).map((prop) => prop.input());
    const filters = this.filterChildren(GridFilter);
    const editFilters = !filters.length
      ? []
      : [GridFilter.FilterSettings(filters)];
    const options = this.filterChildren(Option);
    const editOptions = html`<fieldset>
      <legend>Options</legend>
      <table class="RadioOptions">
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
            `,
          )}
        </tbody>
      </table>
    </fieldset>`;
    return html`<div>${editFilters}${editOptions}${inputs}</div>`;
  }

  settingsChildren() {
    return [];
  }
}
TreeBase.register(Radio, "Radio");
