/* thinking about better ways to write this */

import db from "../db";
import { html } from "uhtml";
import css from "ustyler";
import Globals from "../globals";
import * as icons from "./icons";
import { Prop, Select, String, Integer, Expression, Field } from "./props";
import { TreeBase } from "./treebase";

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

/**
 * @typedef {Button | Group} Target
 */

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
}

/**
 * Group is a collection of Buttons or Groups and associated properties
 * such as the label and cue.
 */
class Group {
  /**
   * @param {Target[]} members
   * @param {Object} props
   */
  constructor(members, props) {
    this.members = members;
    this.props = props;
  }

  get length() {
    return this.members.length * this.props.Cycles.value;
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
}

class PatternBase extends TreeBase {
  /** @type {PatternBase[]} */
  children = [];

  /**
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return input;
  }
}

export class PatternManager extends PatternBase {
  /** @type {Group} */
  targets;
  /**
   * stack keeps track of the nesting as we walk the tree
   * @type {{group: Group, index: number}[]}
   */
  stack = [];

  props = {
    Cycles: new Integer(2, { min: 1 }),
    Cue: new Select(Object.keys(Globals.cues)),
  };

  template() {
    const { Cycles, Cue } = this.Props;
    return html`
      <div
        class=${this.className}
        onChange=${() => this.update()}
        level=${this.level}
      >
        ${Cycles.input()} ${Cue.input()} ${this.orderedChildren()}
        ${this.addChildButton("+Selector", PatternSelector)}
        ${this.addChildButton("+Group", PatternGroup)}
      </div>
    `;
  }

  update() {
    db.write("pattern", this.toObject());
    Globals.state.update();
  }

  /**
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    let members = [];
    for (const child of this.children) {
      const r = child.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    if (members.length > 0) return [new Group(members, this.props)];
    else return [];
  }

  /**
   * Collect the nodes from the DOM and process them into targets
   */
  refresh() {
    // gather the buttons from the UI
    const buttons = [];
    for (const node of document.querySelectorAll("#UI button:not(:disabled)")) {
      if (AccessMap.has(node))
        buttons.push(new Button(/** @type {HTMLElement} */ (node)));
    }

    let members = [];
    for (const child of this.children) {
      const r = child.apply(buttons);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    this.targets = new Group(members, this.props);
    this.start();
  }

  start() {
    this.stack = [{ group: this.targets, index: 0 }];
    this.cue();
  }

  /**
   * current keeps track of the currently active node or group
   * @type {Target}
   */
  get current() {
    const { group, index } = this.stack[0];
    console.log("current", group, index);
    return group.member(index);
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
PatternBase.register(PatternManager);

class PatternGroup extends PatternBase {
  props = {
    Name: new String(""),
    Cycles: new Integer(2, { min: 1 }),
    Cue: new Select(Object.keys(Globals.cues)),
  };
  members = [];

  template() {
    const { Name, Cycles, Cue } = this.Props;
    return html`<fieldset class=${this.className} level=${this.level}>
      <legend>Group: ${Name.value}</legend>
      ${Name.input()} ${Cycles.input()} ${Cue.input()} ${this.orderedChildren()}
      ${this.addChildButton("+Selector", PatternSelector)}
      ${this.addChildButton("+Group", PatternGroup)} ${this.movementButtons()}
    </fieldset>`;
  }

  /**
   * Build a group from the output of the selectors applied to the input
   * @param {Target[]} input
   */
  apply(input) {
    let members = [];
    for (const child of this.children) {
      const r = child.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    if (members.length > 0) return [new Group(members, this.props)];
    else return [];
  }
}
PatternBase.register(PatternGroup);

class PatternSelector extends PatternBase {
  template() {
    return html`<fieldset class=${this.className} level=${this.level}>
      <legend>Selector</legend>
      ${this.unorderedChildren()} ${this.addChildButton("+Filter", Filter)}
      ${this.addChildButton("+Order by", OrderBy)}
      ${this.addChildButton("+Group by", GroupBy)} ${this.movementButtons()}
    </fieldset>`;
  }

  /**
   * Select buttons from the input
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return this.children.reduce(
      (previous, operator) => operator.apply(previous),
      input
    );
  }
}
PatternBase.register(PatternSelector);

class Filter extends PatternBase {
  props = {
    Filter: new Expression(),
  };
  template() {
    const { Filter } = this.Props;
    return html`<div class=${this.className} level=${this.level}>
      ${Filter.input()}${this.deleteButton()}
    </div>`;
  }
  /**
   * Select buttons from the input
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.props)
        )
        .filter((target) => target.length > 0);
    } else {
      return input.filter((/** @type {Button} */ button) =>
        this.props.Filter.eval(button.data)
      );
    }
  }
}
PatternBase.register(Filter);

// allow the sort to handle numbers reasonably
const comparator = new Intl.Collator(undefined, {
  numeric: true,
});

class OrderBy extends PatternBase {
  props = {
    OrderBy: new Field(),
  };
  template() {
    const { OrderBy } = this.Props;
    return html`<div class=${this.className} level=${this.level}>
      ${OrderBy.input()}${this.deleteButton()}
    </div>`;
  }
  /**
   * Select buttons from the input
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.props)
        )
        .filter((target) => target.length > 0);
    } else {
      const key = this.props.OrderBy.value.slice(1);
      return [.../** @type {Button[]} */ (input)].sort((a, b) =>
        comparator.compare(a.data[key], b.data[key])
      );
    }
  }
}
PatternBase.register(OrderBy);

class GroupBy extends PatternBase {
  props = {
    GroupBy: new Field(),
    Name: new String(""),
    Cue: new Select(Object.keys(Globals.cues)),
    Cycles: new Integer(2),
  };
  template() {
    const { GroupBy, Name, Cue, Cycles } = this.Props;
    return html`<div class=${this.className} level=${this.level}>
      ${GroupBy.input()} ${Name.input()} ${this.deleteButton()}
      <details>
        <summary title="Details">${icons.Details}</summary>
        ${Cue.input()} ${Cycles.input()}
      </details>
    </div>`;
  }
  /**
   * Select buttons from the input
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.props)
        )
        .filter((target) => target.length > 0);
    } else {
      const key = this.props.OrderBy.value.slice(1);
      const { GroupBy, props } = this.props;
      const result = [];
      const groupMap = new Map();
      for (const button of /** @type {Button[]} */ (input)) {
        let k = button.data[key];
        if (!k) continue;
        k = k.toString();
        // we got a key, check to see if we have a group
        let group = groupMap.get(k);
        if (!group) {
          // no group, create one and add it to the map and the result
          group = new Group([button], props);
          groupMap.set(k, group);
          result.push(group);
        } else {
          group.members.push(button);
        }
      }
      return result;
    }
  }
}
PatternBase.register(GroupBy);

css`
  div.access-pattern {
    padding-left: 12px;
  }
  .access-pattern .movement {
    margin-top: 0.5em;
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
    border-style: inset;
    border-width: 3px;
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
  .access-pattern .GroupBy details {
    display: inline-block;
    vertical-align: middle;
  }
  .access-pattern .GroupBy details[open] {
    display: inline-block;
    border: ridge;
    padding: 0.5em;
  }
  .access-pattern .GroupBy details summary {
    list-style: none;
    cursor: pointer;
    width: 1em;
    height: 1em;
    border: outset;
    vertical-align: middle;
  }
  .access-pattern .GroupBy details[open] summary {
    margin-left: calc(100% - 1em);
    margin-bottom: 0.2em;
    margin-top: -0.2em;
  }
  .access-pattern input {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .access-pattern select {
    background-color: rgba(255, 255, 255, 0.1);
  }
  ol {
    list-style-type: none;
    counter-reset: item;
    margin: 0;
    padding: 0;
  }

  ol > li {
    display: table;
    counter-increment: item;
    margin-bottom: 0.6em;
  }

  ol > li:before {
    content: counters(item, ".") ". ";
    display: table-cell;
    padding-right: 0.6em;
    font-size: 80%;
  }

  li ol > li {
    margin: 0;
  }

  li ol > li:before {
    content: counters(item, ".") " ";
  }
`;

/*
  .PatternManager {
    --color0: #f6f6ff;
    --color1: #fff6f6;
    --color2: #f6fff6;
  }
  .PatternManager li:nth-child(odd) {
    background-color: var(--color1);
  }
  .PatternManager li:nth-child(even) {
    background-color: var(--color2);
  }
  .PatternManager li:nth-child(odd) li:nth-child(odd) {
    background-color: var(--color0);
  }
  .PatternManager li:nth-child(odd) li:nth-child(even) {
    background-color: var(--color2);
  }
  .PatternManager li:nth-child(even) li:nth-child(odd) {
    background-color: var(--color0);
  }
  .PatternManager li:nth-child(even) li:nth-child(even) {
    background-color: var(--color1);
  }
  .PatternManager *[level="0"] > li:nth-child(odd) {
    background-color: var(--color1);
  }
  .PatternManager *[level="0"] > li:nth-child(even) {
    background-color: var(--color2);
  }
  .PatternManager *[level="1"] > li:nth-child(odd) {
    background-color: var(--color2);
  }
  .PatternManager *[level="1"] > li:nth-child(even) {
    background-color: var(--color0);
  }
  .PatternManager *[level="2"] > li:nth-child(odd) {
    background-color: var(--color0);
  }
  .PatternManager *[level="2"] > li:nth-child(even) {
    background-color: var(--color1);
  }
*/
