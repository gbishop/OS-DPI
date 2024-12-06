import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/radio.css";
import Globals from "app/globals";
import { GridFilter } from "./gridFilter";

// Option Class
class Option extends TreeBase {
  name = new Props.String("", { hiddenLabel: true }); // Hide label in settings
  value = new Props.String("", { hiddenLabel: true }); // Hide label in settings
  selectedColor = new Props.Color("pink", { hiddenLabel: true }); // Hide label
  unselectedColor = new Props.Color("lightgray", { hiddenLabel: true }); // Hide label
  cache = {}; // Cache for performance or state management
}
TreeBase.register(Option, "Option");

// Radio Class
class Radio extends TreeBase {
  // General Properties
  scale = new Props.Float(1); // Scale property
  label = new Props.String(""); // Label for the Radio group

  // State Management Properties
  primaryStateName = new Props.String("$radio"); // Primary state name
  secondaryStateName = new Props.String("$secondaryRadio"); // Secondary state name
  lastClickedStateName = new Props.String("$LastClicked"); // Tracks the last clicked button

  allowedChildren = ["Option", "GridFilter"];

  /** @type {(Option | GridFilter)[]} */
  children = [];

  get options() {
    return this.filterChildren(Option);
  }

  /**
   * Determines if an option is valid based on current filters and data.
   * @param {Option} option
   * @returns {boolean}
   */
  valid(option) {
    const { data, state } = Globals;
    const filters = this.filterChildren(GridFilter);
    return (
      !filters.length ||
      data.hasMatchingRows(
        filters,
        state.clone({
          [this.primaryStateName.value]: option.value.value,
          [this.secondaryStateName.value]: option.value.value,
        }),
        option.cache || {}
      )
    );
  }

  /**
   * Handles click events on the radio buttons.
   * Defined as an arrow function to preserve 'this' context.
   * @param {MouseEvent} event
   */
  handleClick = ({ target }) => {
    if (target instanceof HTMLButtonElement) {
      const value = target.value;
      const primaryState = this.primaryStateName.value;
      const secondaryState = this.secondaryStateName.value;
      const lastClickedState = this.lastClickedStateName.value;
      const lastClicked = Globals.state.get(lastClickedState);
      const stateUpdates = {};

      if (lastClicked === value) {
        // Toggle off if the same button is clicked again
        stateUpdates[primaryState] = null;
        stateUpdates[secondaryState] = null;
        stateUpdates[lastClickedState] = null; // Optionally reset last clicked
      } else {
        // Set the new value for both primary and secondary states
        stateUpdates[primaryState] = value;
        stateUpdates[secondaryState] = value;
        stateUpdates[lastClickedState] = value; // Update last clicked button
      }

      Globals.state.update(stateUpdates);
    }
  };

  /**
   * Initializes the primary and secondary states if they are not already set.
   * This method should be called once after the component is mounted.
   */
  initializeStates() {
    const { state } = Globals;
    const primaryStateName = this.primaryStateName.value;
    const secondaryStateName = this.secondaryStateName.value;

    if (!state.get(primaryStateName)) {
      const firstValidOption = this.options.find((option) => this.valid(option));
      if (firstValidOption) {
        const value = firstValidOption.value.value;
        state.update({
          [primaryStateName]: value,
          [secondaryStateName]: value,
        });
      } else {
        console.warn("No valid options available to initialize the Radio component.");
      }
    }
  }

  /**
   * Generates the HTML template for the Radio component.
   * @returns {HTMLElement}
   */
  template() {
    const { state } = Globals;
    const primaryStateName = this.primaryStateName.value;
    const secondaryStateName = this.secondaryStateName.value;
    const radioLabel = this.label.value;

    // Initialize states if not already set
    this.initializeStates();

    const currentPrimary = state.get(primaryStateName);
    const currentSecondary = state.get(secondaryStateName);

    const choices = this.options.map((choice, index) => {
      const choiceDisabled = !this.valid(choice);
      const choiceValue = choice.value.value;
      const choiceName = choice.name.value;

      // Determine if the current choice is selected in either state
      const isSelectedPrimary = choiceValue === currentPrimary;
      const isSelectedSecondary = choiceValue === currentSecondary;
      const isSelected = isSelectedPrimary || isSelectedSecondary;
      const color = isSelected
        ? choice.selectedColor.value
        : choice.unselectedColor.value;

      return html`<button
        style=${styleString({ backgroundColor: color })}
        value=${choiceValue}
        ?disabled=${choiceDisabled}
        data=${{
          ComponentType: this.className,
          ComponentName: radioLabel || primaryStateName,
          label: choiceName,
        }}
        @click=${this.handleClick}
       >
        ${choiceName}
      </button>`;
    });

    return this.component(
      {},
      html`<fieldset class="flex" role="radiogroup">
        ${radioLabel ? html`<legend>${radioLabel}</legend>` : null}
        ${choices}
      </fieldset>`
    );
  }

  /**
   * Generates the settings UI for the Radio component.
   * @returns {HTMLElement[]}
   */
  settingsDetails() {
    const props = this.props;

    // Exclude properties handled in specific fieldsets to prevent duplication
    const excludedProps = new Set([
      "primaryStateName",
      "secondaryStateName",
      "lastClickedStateName",
      // Color properties are handled within each Option
    ]);

    // Include only props not in excludedProps
    const generalInputs = Object.entries(props)
      .filter(([key]) => !excludedProps.has(key))
      .map(([, prop]) => prop.input());

    const filters = this.filterChildren(GridFilter);
    const editFilters = filters.length
      ? [GridFilter.FilterSettings(filters)]
      : [];

    const options = this.filterChildren(Option);
    const editOptions = html`<fieldset>
      <legend>Options</legend>
      <table class="RadioOptions">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Value</th>
            <th>Selected Color</th>
            <th>Unselected Color</th>
          </tr>
        </thead>
        <tbody>
          ${options.map(
            (option, index) => html`
              <tr>
                <td>${index + 1}</td>
                <td>${option.name.input()}</td>
                <td>${option.value.input()}</td>
                <td>${option.selectedColor.input()}</td> <!-- No extra label -->
                <td>${option.unselectedColor.input()}</td> <!-- No extra label -->
              </tr>
            `
          )}
        </tbody>
      </table>
    </fieldset>`;

    // State Management Settings with Descriptive Labels
    const stateSettings = html`<fieldset>
      <legend>State Management</legend>
      <label>
        
        ${this.primaryStateName.input()}
      </label>
      <label>
        
        ${this.secondaryStateName.input()}
      </label>
      <label>
        
        ${this.lastClickedStateName.input()}
      </label>
    </fieldset>`;

    return [
      html`<div>
        ${editFilters}
        ${editOptions}
        ${stateSettings}
        ${generalInputs}
      </div>`,
    ];
  }

  /**
   * Returns the children settings, currently empty.
   * @returns {HTMLElement}
   */
  settingsChildren() {
    return html`<div />`;
  }
}
TreeBase.register(Radio, "Radio");
