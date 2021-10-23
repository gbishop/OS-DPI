/** Variations on encapsulated input controls */

import { html } from "uhtml";
import Tribute from "tributejs";

/**
 * @typedef {Object} Suggestion
 * @property {string} key
 * @property {string[]} values
 *
 * @typedef {Object} InputOptions
 * @property {string} type
 * @property {string} name
 * @property {string} label
 * @property {boolean} [labelHidden]
 * @property {string|string[]} value
 * @property {Context} context
 * @property {Set<string>} [choices]
 * @property {Set<string>} [suggestions]
 * @property {(value: any, input?: HTMLInputElement) => string} [validate]
 * @property {(name: string, value: any) => void} [update]
 * @property {string} [className]
 */

const dataListMap = new WeakMap();
let dataListCount = 0;

/** @param {string[]} choices */
function createDataList(choices) {
  if (!choices) {
    return {
      id: null,
      render() {
        return html``;
      },
    };
  }
  if (!dataListMap.has(choices)) {
    const id = `DataList${dataListCount++}`;
    dataListMap.set(choices, {
      id,
      render() {
        return html`<datalist id=${id}>
          ${Array.from(choices).map(
            (choice) => html`<option>${choice}</option>`
          )}
        </datalist>`;
      },
    });
    return dataListMap.get(choices);
  }
}

const suggesterMap = new WeakMap();

/** @param {Set<string>} suggestions */
function createSuggester(suggestions) {
  if (!suggestions) {
    return {};
  }
  /** @param {HTMLInputElement} element */
  return (element) => {
    let lastPattern = "";
    if (!suggesterMap.has(element)) {
      const collections = ["$", "#"].map((key) => ({
        trigger: key,
        values: [],
        /** @param {any} item */
        selectTemplate: function (item) {
          return (item && item.key.trim()) || key + lastPattern;
        },
        /** @param {any} item */
        menuItemTemplate: function (item) {
          return item.key;
        },
        noMatchTemplate: function () {
          return "";
        },
        lookup: "key", // need this?
      }));
      const tribute = new Tribute({
        collection: collections,
        noMatchTemplate: () => "",
      });
      /* Hack the tribute search to make it NOT be fuzzy */
      /** @param {string} pattern
       * @param {Object} items
       */
      // @ts-ignore
      tribute.search.filter = (pattern, items) => {
        lastPattern = pattern;
        pattern = pattern.toLowerCase();
        const r = items.filter((/** @type {any} */ item) =>
          item.key.slice(1).toLowerCase().startsWith(pattern)
        );
        return r;
      };
      tribute.attach(element);
      suggesterMap.set(element, tribute);
    }
    const tribute = suggesterMap.get(element);
    const groups = [[], []];
    suggestions.forEach((suggestion) => {
      const index = ["$", "#"].indexOf(suggestion[0]);
      if (index >= 0) {
        groups[index].push(suggestion);
      }
    });
    groups.forEach((group, index) =>
      tribute.append(
        index,
        group.map((value) => ({ key: value })),
        true // replace
      )
    );
  };
}

/**
 * Generate an input element
 *
 * @param {InputOptions} options
 */
export function textInput(options) {
  const list = createDataList((options.choices && [...options.choices]) || []);
  const suggester = createSuggester(options.suggestions);
  return html`<label for=${options.name} ?hidden=${options.labelHidden}
      >${options.label}</label
    >
    <input
      type=${options.type}
      id=${options.name}
      name=${options.name}
      .value=${options.value}
      class=${options.className}
      onchange=${(/** @type {InputEventWithTarget} */ event) => {
        const input = event.target;
        const value = input.value.trim();
        const msg = (options.validate && options.validate(value)) || "";
        input.setCustomValidity(msg);
        input.reportValidity();
        if (!msg) options.update(options.name, value);
      }}
      list=${list.id}
      autocomplete="off"
      ref=${suggester}
    />
    ${list.render()}`;
}
