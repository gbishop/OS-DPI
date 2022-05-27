import { html } from "../_snowpack/pkg/uhtml.js";
import css from "../_snowpack/pkg/ustyler.js";
import { Base } from "./base.js";
import * as icons from "./icons.js";
import { evalInContext, validateExpression } from "../eval.js";
import { comparators } from "../data.js";
import db from "../db.js";
import { Globals } from "../start.js";

/** Maintain data for each visible button in a WeakMap
 * @type {WeakMap<Node, Object>}
 */
export const AccessMap = new WeakMap();

/** Provide a ref to update the map
 * @param {Object} data
 * @returns {function(Node)}
 */
export function UpdateAccessData(data) {
  return (node) => AccessMap.set(node, data);
}

// alternating styles for nested elements
const Backgrounds = ["#f6f6ff", "#fff6f6", "#f6fff6"].map(
  (color) => `background: ${color}`
);

/**
 * Types for the pattern stored representation
 * @typedef {Object} PatternFilter
 * @property {string} filter - the field to filter on
 * @property {string} comparison
 * @property {string} [value]
 *
 * @typedef {Object} PatternOrderBy
 * @property {string} orderBy - the field to sort by
 *
 * @typedef {Object} PatternGroupBy
 * @property {string} groupBy - the field to group by
 * @property {number} cycles - the number of cycles for each group
 * @property {string} name - the name of each group
 * @property {string} cue - the cue for each group
 *
 * @typedef {PatternFilter|PatternOrderBy|PatternGroupBy} PatternOperator
 *
 * @typedef {PatternOperator[]} PatternSelector
 *
 * @typedef {Object} PatternGroup
 * @property {string} name
 * @property {number} cycles
 * @property {string} cue
 * @property {PatternMember[]} members
 *
 * @typedef {PatternSelector|PatternGroup} PatternMember
 */

/**
 * @param {function(): void} refresh
 * @returns
 */
function ObjectEditorInputs(refresh) {
  return {
    /**
     * Create a select input
     * @param {Object} options
     * @param {Object} options.container
     * @param {string} options.name
     * @param {string} options.label
     * @param {string[]} options.choices
     * @param {string} [options.title]
     * @param {boolean} [options.hidden]
     * @returns {Hole}
     */
    select({ container, name, label, choices, title = "", hidden = false }) {
      return html`<label ?hiddenLabel=${hidden}>
        <span>${label}</span>
        <select
          title=${title}
          onchange=${(e) => {
            container[name] = e.target.value;
            refresh();
          }}
        >
          ${choices.map(
            (option) =>
              html`<option
                value=${option}
                ?selected=${container[name] == option}
              >
                ${option}
              </option>`
          )}
        </select></label
      >`;
    },
    /**
     * Create a select input for content fields
     * @param {Object} options
     * @param {Object} options.container
     * @param {string} options.name
     * @param {string} options.label
     * @param {boolean} [options.hidden]
     * @returns {Hole}
     */
    field({ container, name, label, hidden = false }) {
      const choices = [...Globals.data.allFields, "#name"].sort();
      return this.select({
        container,
        name,
        label,
        choices,
        hidden,
        title: "Choose a field",
      });
    },
    /**
     * Create a select input for comparison operators
     * @param {Object} options
     * @param {Object} options.container
     * @param {string} options.name
     * @param {string} options.label
     * @param {boolean} [options.hidden]
     * @returns {Hole}
     */
    comparison({ container, name, label, hidden = false }) {
      const choices = Object.keys(comparators);
      return this.select({
        container,
        name,
        label,
        choices,
        hidden,
        title: "Choose a comparison",
      });
    },
    /**
     * Create a string input
     * @param {Object} options
     * @param {Object} options.container
     * @param {string} options.name
     * @param {string} options.label
     * @param {string} [options.title]
     * @param {boolean} [options.hidden]
     * @returns {Hole}
     */
    string({ container, name, label, hidden = false, title = "" }) {
      return html`<label ?hiddenLabel=${hidden}>
        <span>${label}</span>
        <input
          type="text"
          .value=${container[name] || ""}
          onchange=${(e) => {
            container[name] = e.target.value;
            refresh();
          }}
          title=${title}
        />
      </label>`;
    },
    /**
     * Create an expression input
     * @param {Object} options
     * @param {Object} options.container
     * @param {string} options.name
     * @param {string} options.label
     * @param {string} [options.title]
     * @param {boolean} [options.hidden]
     * @returns {Hole}
     */
    expression({ container, name, label, hidden = false, title = "" }) {
      return html`<input
        type="text"
        id=${name}
        name=${name}
        .value=${container[name]}
        title=${title}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          const input = event.target;
          const value = input.value.trim();
          const msg = validateExpression(value) ? "" : "Invalid value";
          container[name] = value;
          input.setCustomValidity(msg);
          input.reportValidity();
          refresh();
        }}
      />`;
    },
    /**
     * Create a number input
     * @param {Object} options
     * @param {Object} options.container
     * @param {string} options.name
     * @param {string} options.label
     * @param {number} [options.min]
     * @param {number} [options.max]
     * @param {number} [options.step]
     * @param {string} [options.title]
     * @param {boolean} [options.hidden]
     * @returns {Hole}
     */
    number({
      container,
      name,
      label,
      hidden = false,
      min = 0,
      max = undefined,
      step = 1,
      title = "",
    }) {
      return html`<label ?hiddenLabel=${hidden}>
        <span>${label}</span>
        <input
          type="number"
          min=${min}
          max=${max}
          step=${step}
          title=${title}
          .value=${container[name] || ""}
          onchange=${(e) => {
            container[name] = e.target.valueAsNumber;
            refresh();
          }}
        />
      </label>`;
    },
  };
}

function ArrayEditorButtons(refresh) {
  return {
    /**
     *
     * @param {Object} options
     * @param {Array} options.container
     * @param {number} options.index
     * @param {string} [options.title]
     * @returns {Hole}
     */
    up({ container, index, title = "Move up" }) {
      return html`<button
        title=${title}
        ?disabled=${index == 0}
        onClick=${() => {
          const item = container[index];
          container[index] = container[index - 1];
          container[index - 1] = item;
          refresh();
        }}
      >
        ${icons.UpArrow}
      </button>`;
    },
    /**
     *
     * @param {Object} options
     * @param {Array} options.container
     * @param {number} options.index
     * @param {string} [options.title]
     * @returns {Hole}
     */
    down({ container, index, title = "Move down" }) {
      return html`<button
        title=${title}
        ?disabled=${index >= container.length - 1}
        onClick=${() => {
          const item = container[index];
          container[index] = container[index + 1];
          container[index + 1] = item;
          refresh();
        }}
      >
        ${icons.DownArrow}
      </button>`;
    },
    /**
     *
     * @param {Object} options
     * @param {Array} options.container
     * @param {number} options.index
     * @param {string} [options.title]
     * @returns {Hole}
     */
    delete({ container, index, title = "Delete" }) {
      return html`<button
        title=${title}
        onClick=${() => {
          container.splice(index, 1);
          refresh();
        }}
      >
        ${icons.Trash}
      </button>`;
    },
    /**
     *
     * @param {Object} options
     * @param {Array} options.container
     * @param {Object} options.initial
     * @param {string} options.label
     * @param {string} [options.title]
     * @returns {Hole}
     */
    add({ container, initial, label, title = "" }) {
      return html`<button
        title=${title}
        onClick=${() => {
          container.push(initial);
          refresh();
        }}
      >
        ${label}
      </button>`;
    },
  };
}

export class AccessPattern extends Base {
  /**
   * @param {SomeProps} props
   * @param {Base|Null} parent
   */
  constructor(props, parent) {
    super(props, parent);
    const { state, pattern } = Globals;
    function update() {
      state.update();
      db.write("pattern", pattern);
    }
    this.buttons = ArrayEditorButtons(update);
    this.inputs = ObjectEditorInputs(update);
  }

  template() {
    const { state, pattern } = Globals;
    return html`<div class="access-pattern">
      <h1>Access Pattern</h1>
      ${this.renderGroup(pattern)}
    </div>`;
  }

  renderGroup(group, index = 0, parent = null, background = 0) {
    return html`<fieldset style="${Backgrounds[background]}">
      ${parent
        ? html`<legend>Group: ${group.name}</legend>
            ${this.inputs.string({
              container: group,
              name: "name",
              label: "Name",
            })}`
        : html``}
      ${this.inputs.number({
        container: group,
        name: "cycles",
        label: "Cycles",
        min: 1,
      })}
      ${this.inputs.select({
        container: group,
        name: "cue",
        label: "Cue",
        choices: ["default"],
      })}
      <ol class="groupmembers">
        ${group.members.map((member, index, memberContainer) => {
          const nextColor = (background + (index % 2) + 1) % 3;
          if ("name" in member) {
            return html`<li>
              ${this.renderGroup(member, index, memberContainer, nextColor)}
            </li>`;
          } else {
            return html`<li>
              ${this.renderSelector(member, index, memberContainer, nextColor)}
            </li>`;
          }
        })}
      </ol>
      ${this.buttons.add({
        container: group.members,
        initial: [],
        label: "+Selector",
      })}
      ${this.buttons.add({
        container: group.members,
        initial: { name: "", cycles: 1, members: [], cue: "default" },
        label: "+Group",
      })}
      ${this.renderMovementButtons(group, index, parent)}
    </fieldset> `;
  }

  renderSelector(selector, index, parent, background) {
    return html`<fieldset class="selector" style=${Backgrounds[background]}>
      <legend>Selector</legend>
      <ul class="operators">
        ${selector.map(
          (operator, index, member) =>
            html` <li>
              <div>
                ${this.renderOperator(operator, index, member)}
                ${this.buttons.delete({ container: selector, index })}
              </div>
            </li>`
        )}
      </ul>
      ${this.buttons.add({
        container: selector,
        initial: { filter: "", comparison: "", value: "" },
        label: "+Filter",
      })}
      ${this.buttons.add({
        container: selector,
        initial: { orderBy: "" },
        label: "+Order By",
      })}
      ${this.buttons.add({
        container: selector,
        initial: { groupBy: "", name: "", cue: "" },
        label: "+Group By",
      })}
      ${this.renderMovementButtons(selector, index, parent)}
    </fieldset>`;
  }

  renderOperator(op, index, list) {
    if ("filter" in op) {
      const value =
        op.comparison.indexOf("empty") < 0
          ? this.inputs.expression({
              container: op,
              name: "value",
              label: "Value",
              hidden: true,
            })
          : html``;
      return html`${this.inputs.field({
        container: op,
        name: "filter",
        label: "Filter",
      })}
      ${this.inputs.comparison({
        container: op,
        name: "comparison",
        label: "Comparison",
        hidden: true,
      })}
      ${value}`;
    } else if ("orderBy" in op) {
      return this.inputs.field({
        container: op,
        name: "orderBy",
        label: "Order by",
      });
    } else if ("groupBy" in op) {
      return html`${this.inputs.field({
          container: op,
          name: "groupBy",
          label: "Group by",
        })}
        ${this.inputs.string({ container: op, name: "name", label: "Name" })}
        <details>
          <summary title="Details">${icons.Details}</summary>
          ${this.inputs.string({ container: op, name: "cue", label: "Cue" })}
          ${this.inputs.number({
            container: op,
            name: "cycles",
            label: "Cycles",
          })}
        </details> `;
    }
  }

  renderMovementButtons(item, index, container) {
    if (container) {
      return html`<div class="movement">
        ${this.buttons.up({ container, index })}
        ${this.buttons.down({ container, index })}
        ${this.buttons.delete({ container, index })}
      </div>`;
    } else {
      return html``;
    }
  }
}

/**
 * Button is the DOM button annotated with the info from the AccessMap
 */
class Button {
  /** @param {HTMLElement} button */
  constructor(button) {
    this.data = AccessMap.get(button);
    this.button = button;
  }

  cue(value = "button") {
    this.button.setAttribute("cue", value);
  }

  json() {
    return this.button.innerText;
  }
}

/** @typedef {Object} GroupProperties */

/**
 * Group is a collection of Buttons or Groups and associated properties
 * such as the label and cue.
 */
class Group {
  /**
   * @param {Target[]} members
   * @param {GroupProperties} properties
   */
  constructor(members, properties, cycles = 1) {
    this.members = members;
    this.properties = properties;
    this.cycles = cycles;
  }

  get length() {
    return this.members.length * this.cycles;
  }

  member(index) {
    if (index < 0 || index >= this.length) {
      return undefined;
    } else {
      return this.members[index % this.length];
    }
  }

  cue(value = "group") {
    // console.log("cue group", this.members);
    for (const member of this.members) {
      member.cue(value);
    }
  }

  // for debugging
  allNodes() {
    return this.members
      .map((member) =>
        member instanceof Group ? member.allNodes() : member.button
      )
      .flat();
  }

  json() {
    return [this.properties.label].concat(
      this.members.map((member) => member.json())
    );
  }
}

/**
 * Selector collects Buttons
 */
class Selector {
  /**
   * Select elements from the input
   * @param {Target[]} input
   * @returns {Target[]|Group}
   */
  apply(input) {
    return input;
  }
}

/**
 * GroupSelector takes the output of one or more selectors and
 * creates a new group.
 */
class GroupSelector extends Selector {
  /**
   * @param {PatternGroup} pattern
   */
  constructor(pattern) {
    super();
    const selectors = pattern.members.map((member) => {
      if ("name" in member) {
        return new GroupSelector(member);
      } else {
        return new SimpleSelector(member);
      }
    });
    this.selectors = selectors;
    this.properties = {
      cycles: pattern.cycles,
      cue: pattern.cue,
      label: pattern.name,
    };
  }
  /**
   * Build a group from the output of the selectors applied to the input
   * @param {Target[]} input
   * @returns {Group}
   */
  apply(input) {
    let members = [];
    for (const selector of this.selectors) {
      const r = selector.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    return new Group(members, this.properties);
  }
}

class SimpleSelector extends Selector {
  /**
   *
   * @param {PatternOperator[]} selectionOperators
   */
  constructor(selectionOperators) {
    super();
    this.operators = selectionOperators.map((operator) => {
      if ("filter" in operator) {
        return new FilterOperator(operator);
      } else if ("orderBy" in operator) {
        return new OrderByOperator(operator);
      } else if ("groupBy" in operator) {
        return new GroupByOperator(operator);
      }
    });
  }
  /**
   * Apply the selector to the Buttons to produce an array of nodes
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return this.operators.reduce(
      (previous, operator) => operator.apply(previous),
      input
    );
  }
}

/**
 * @typedef {Button|Group} Target
 *
 */

export class AccessNavigator {
  /**
   * These are the buttons (or whatever) from the DOM plus the access data
   * from the AccessMap
   * @type {Button[]} */
  buttons = [];
  /**
   * targets are buttons or groups
   * @type {Group}
   */
  targets = new Group([], {});
  /**
   * selectors are the rules for aggregating and selecting targets nodes to make targets
   *
   * @type {GroupSelector}
   */
  selector = null;

  /**
   * current keeps track of the currently active node or group
   * @type {Target}
   */
  get current() {
    const { group, index } = this.stack[0];
    console.log("current", group, index);
    return group.member(index);
  }

  /**
   * stack keeps track of the nesting as we walk the tree
   * @type {{group: Group, index: number}[]}
   */
  stack = [];

  /**
   * Collect the nodes from the DOM and process them into targets
   */
  refresh() {
    // gather the buttons from the UI
    this.buttons = [];
    for (const node of document.querySelectorAll("#UI button:not(:disabled)")) {
      if (AccessMap.has(node))
        this.buttons.push(new Button(/** @type {HTMLElement} */ (node)));
    }

    if (this.selector) {
      const targets = this.selector.apply(this.buttons);
      this.targets = targets;

      this.start();
    }
  }

  /**
   *
   * @param {PatternGroup} pattern
   */
  setSelectors(pattern) {
    this.selector = new GroupSelector(pattern);
    // this.refresh();
  }

  start() {
    this.stack = [{ group: this.targets, index: 0 }];
    this.cue();
  }

  next() {
    const top = this.stack[0];
    if (top.index < top.group.length - 1) {
      top.index++;
    } else if (this.stack.length > 1) {
      this.stack.shift();
    } else if (this.stack.length == 1) {
      top.index = 0;
    } else {
      // stack is empty ignore
    }
    this.cue();
  }

  activate() {
    let current = this.current;
    if (current instanceof Button) {
      const name = current.data.name;
      if ("onClick" in current.data) {
        current.data.onClick();
      } else {
        Globals.rules.applyRules(name, "press", current.data);
      }
    } else if (current instanceof Group) {
      console.log("activate group", current, this.stack);
      while (current.length == 1 && current.members[0] instanceof Group) {
        current = current.members[0];
      }
      this.stack.unshift({ group: current, index: 0 });
      console.log("activated", this.current, this.stack);
    }
    this.cue();
  }

  clearCue() {
    for (const element of document.querySelectorAll("[cue]")) {
      element.removeAttribute("cue");
    }
  }

  cue() {
    this.clearCue();
    const current = this.current;
    if (current instanceof Button) {
      this.stack[0].group.cue();
    }
    this.current.cue();
  }
}

class Operator {
  /**
   * Apply the operator to an array of Buttons to produce an array of Targets
   * @param {Button[]} input
   * @returns {Target[]}
   */
  base(input) {
    return input;
  }
  /**
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input.map(
        (/** @type {Group} */ group) =>
          new Group(this.apply(group.members), group.properties)
      );
    } else {
      return this.base(/** @type {Button[]} */ (input));
    }
  }
}

class FilterOperator extends Operator {
  /**
   *
   * @param {PatternFilter} filter
   */
  constructor(filter) {
    super();
    this.predicate = (button) => {
      const field = button[filter.filter] || "";
      const comparator = comparators[filter.comparison];
      let v = undefined;
      if (filter.comparison.indexOf("empty") < 0) {
        v = evalInContext(filter.value);
      }
    };
  }
  /**
   * Apply the operator to an array of Buttons to produce an array of Targets
   * @param {Button[]} input
   * @returns {Target[]}
   */
  base(input) {
    return input.filter(this.predicate);
  }
}

// allow the sort to handle numbers reasonably
const comparator = new Intl.Collator(undefined, {
  numeric: true,
});

class OrderByOperator extends Operator {
  /**
   *
   * @param {PatternOrderBy} key
   */
  constructor(key) {
    super();
    this.key = (button) => button[key.orderBy.slice(1)];
  }
  /**
   * Apply the operator to an array of Buttons to produce an array of Targets
   * @param {Button[]} input
   * @returns {Target[]}
   */
  base(input) {
    return [...input].sort((a, b) =>
      comparator.compare(this.key(a), this.key(b))
    );
  }
}

class GroupByOperator extends Operator {
  /**
   * @param {PatternGroupBy} pat
   */
  constructor(pat) {
    super();
    this.key = (button) => button[pat.groupBy.slice(1)];
    this.properties = { name: pat.name, cycles: pat.cycles, cue: pat.cue };
  }
  /**
   * Apply the operator to an array of Buttons to produce an array of Targets
   * @param {Button[]} input
   * @returns {Target[]}
   */
  base(input) {
    const result = [];
    /** @type {Map<Object,Group>} */
    const groupMap = new Map();
    for (const node of input) {
      const k = this.key(node).toString();
      // we got a key, check to see if we have a group
      let group = groupMap.get(k);
      if (!group) {
        // no group, create one and add it to the map and the result
        group = new Group([node], this.properties);
        groupMap.set(k, group);
        result.push(group);
      } else {
        group.members.push(node);
      }
    }
    return result;
  }
}

css`
  .access-pattern .movement {
    margin-top: 0.5em;
  }
  .access-pattern .movement button {
  }
  .access-pattern button svg {
    object-fit: contain;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin: -4px;
  }
  .access-pattern button {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 0.5em;
    border: outset;
  }
  .access-pattern fieldset {
    margin-bottom: 0.5em;
  }
  .access-pattern ol {
    padding-inline-start: 10px;
  }
  .access-pattern ul {
    padding-inline-start: 10px;
  }
  .access-pattern label[hiddenlabel] span {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
  .access-pattern label {
    display: inline-block;
  }
  .access-pattern .operators li div {
  }
  .access-pattern .operators li div details {
    display: inline-block;
    vertical-align: middle;
  }
  .access-pattern .operators li div details[open] {
    display: block;
  }
  .access-pattern .operators li div details summary {
    list-style: none;
    cursor: pointer;
    width: 1em;
    height: 1em;
    border: outset;
    vertical-align: middle;
    display: inline;
  }
  .access-pattern input {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .access-pattern select {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const accessNavigator = new AccessNavigator();
