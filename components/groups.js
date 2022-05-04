/** A manager for access groups */

import css from "ustyler";
import { AccessMap } from "./access";

/**
 * AButton is the DOM button annotated with the info from the AccessMap
 */
class AButton {
  /** @param {Element} button */
  constructor(button) {
    this.data = AccessMap.get(button);
    this.button = button;
  }

  cue(value = "button") {
    this.button.setAttribute("cue", value);
  }
}

/** @typedef {Object} GroupProperties */

/**
 * AGroup is a collection of Buttons or Groups and associated properties
 * such as the label and cue.
 */
class AGroup {
  /**
   * @param {ATarget[]} members
   * @param {GroupProperties} properties
   */
  constructor(members, properties) {
    this.members = members;
    this.properties = properties;
  }

  cue(value = "group") {
    // console.log("cue group", this.members);
    for (const member of this.members) {
      member.cue(value);
    }
  }
}

/**
 * ASelector collects Buttons
 */
class ASelector {
  /**
   * Select elements from the input
   * @param {ATarget[]} input
   * @returns {ATarget[]}
   */
  apply(input) {
    return input;
  }
}

/**
 * AGroupSelector takes the output of one or more selectors and
 * creates a new group.
 */
class AGroupSelector extends ASelector {
  /**
   * @param {ASelector[]} builders
   * @param {Object} properties
   */
  constructor(builders, properties) {
    super();
    this.builders = builders;
    this.properties = properties;
  }
  /**
   * Build a group from the output of the selectors applied to the input
   * @param {ATarget[]} input
   * @returns {ATarget[]}
   */
  apply(input) {
    const members = [].concat(
      ...this.builders.map((builder) => builder.apply(input))
    );
    return [new AGroup(members, this.properties)];
  }
}

class ASimpleSelector extends ASelector {
  /**
   *
   * @param {SelectionOperator[]} selectionOperators
   */
  constructor(selectionOperators) {
    super();
    this.operators = selectionOperators;
  }
  /**
   * Apply the selector to the Buttons to produce an array of nodes
   * @param {ATarget[]} input
   * @returns {ATarget[]}
   */
  apply(input) {
    return this.operators.reduce(
      (previous, operator) => operator(previous),
      input
    );
  }
}

/**
 * @typedef {AButton|AGroup} ATarget
 *
 * @typedef {function(ATarget[]): ATarget[]} SelectionOperator
 *
 */

export class AccessGroupManager {
  /**
   * These are the buttons (or whatever) from the DOM plus the access data
   * from the AccessMap
   * @type {AButton[]} */
  buttons = [];
  /**
   * targets are buttons or groups
   * @type {AGroup}
   */
  targets = new AGroup([], {});
  /**
   * selectors are the rules for aggregating and selecting targets nodes to make targets
   *
   * @type {ASelector[]}
   */
  selectors = [];

  /**
   * current keeps track of the currently active node or group
   * @type {ATarget}
   */
  get current() {
    const { group, index } = this.stack[0];
    console.log("current", group.properties, index);
    return group.members[index];
  }

  /**
   * stack keeps track of the nesting as we walk the tree
   * @type {{group: AGroup, index: number}[]}
   */
  stack = [];

  /**
   * Collect the nodes from the DOM and process them into targets
   */
  refresh() {
    // gather the buttons from the UI
    this.buttons = [];
    for (const node of document.querySelectorAll("#UI button:not(:disabled)")) {
      this.buttons.push(new AButton(node));
    }
    // apply the builders to get the targets
    this.targets.members = [].concat(
      ...this.selectors.map((builder) => builder.apply(this.buttons))
    );
    console.log("targets", this.targets);

    this.start();
  }

  /**
   *
   * @param {ASelector[]} selectors
   */
  setSelectors(selectors) {
    this.selectors = selectors;
    // this.refresh();
  }

  start() {
    this.stack = [{ group: this.targets, index: 0 }];
    this.cue();
  }

  next() {
    const top = this.stack[0];
    if (top.index < top.group.members.length - 1) {
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

  /**
   *
   * @param {Context} context
   */
  activate(context) {
    let current = this.current;
    if (current instanceof AButton) {
      const name = current.data.name;
      if ("onClick" in current.data) {
        current.data.onClick();
      } else {
        context.rules.applyRules(name, "press", current.data);
      }
    } else if (current instanceof AGroup) {
      console.log("activate group", current, this.stack);
      while (
        current.members.length == 1 &&
        current.members[0] instanceof AGroup
      ) {
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
    if (current instanceof AButton) {
      this.stack[0].group.cue();
    }
    this.current.cue();
  }
}
/**
 * Construct an operator that can handle nested Groups and Nodes from
 * an operator that only handles Nodes.
 *
 * I'm assuming that the lists are all Nodes or all Groups.
 *
 * @param {function(AButton[]): ATarget[]} simpleOperator
 * @returns {function(ATarget[]): ATarget[]}
 */

function makeHigherOrderOperator(simpleOperator) {
  /** @param {ATarget[]} input */
  function higherOrderOperator(input) {
    // if the first is a group they all are
    if (input[0] instanceof AGroup) {
      /** @type {AGroup[]} */
      const r = input.map((/** @type {AGroup} */ group) => {
        if (group instanceof AGroup)
          return new AGroup(
            higherOrderOperator(group.members),
            group.properties
          );
        else throw new Error("Internal error, this should be a group");
      });
      return r;
    } else {
      const r = simpleOperator(/** @type {AButton[]} */ (input));
      return r;
    }
  }
  return higherOrderOperator;
}

/**
 *
 * @param {function(AButton): boolean} predicate
 * @returns {function(ATarget[]): ATarget[]}
 */
function makeFilterOperator(predicate) {
  return makeHigherOrderOperator((input) => input.filter(predicate));
}

// allow the sort to handle numbers reasonably
const comparator = new Intl.Collator(undefined, {
  numeric: true,
});

/**
 * Order the nodes by the given key
 *
 * @param {function(AButton): string} key
 * @returns {function(ATarget[]): ATarget[]}
 */
function makeOrderByOperator(key) {
  return makeHigherOrderOperator((input) =>
    [...input].sort((a, b) => comparator.compare(key(a), key(b)))
  );
}

/**
 * Produce a list of Groups from a list of Nodes
 *
 * @param {AButton[]} input
 * @param {function(AButton): string} key
 * @param {function(AButton): Object} properties
 * @returns {AGroup[]}
 */
function groupBy(input, key, properties) {
  // console.log("groupby", input);
  const result = [];
  /** @type {Map<Object,AGroup>} */
  const groupMap = new Map();
  for (const node of input) {
    const k = key(node).toString();
    // we got a key, check to see if we have a group
    let group = groupMap.get(k);
    if (!group) {
      // no group, create one and add it to the map and the result
      group = new AGroup([node], properties(node));
      groupMap.set(k, group);
      result.push(group);
    } else {
      group.members.push(node);
    }
  }
  return result;
}

/**
 *
 * @param {function(AButton): string} key
 * @param {function(AButton): Object} properties
 * @returns
 */
function makeGroupByOperator(key, properties) {
  return makeHigherOrderOperator((input) => groupBy(input, key, properties));
}

function makeCycleOperator(count) {
  return makeHigherOrderOperator((input) => {
    let result = [];
    for (let i = count; i > 0; i--) {
      result = result.concat(input);
    }
    return result;
  });
}

export function createSelectors() {
  /** @type {ASelector[]} */
  const selectors = [
    new AGroupSelector(
      [
        new ASimpleSelector([
          makeFilterOperator((node) => node.data.controls),
          makeOrderByOperator((node) => node.data.controls),
          makeCycleOperator(2),
        ]),
      ],
      { label: "controls" }
    ),
    new ASimpleSelector([
      makeFilterOperator((node) => !node.data.controls),
      makeGroupByOperator(
        (node) => node.data.name,
        (node) => ({ label: node.data.name })
      ),
      makeGroupByOperator(
        (node) => node.data.row || 0,
        (node) => ({
          label: `row ${node.data.row}`,
        })
      ),
    ]),
  ];
  return selectors;
}

// hack some css so I can see the groups
css`
  button[cue="group"] {
    position: relative;
  }
  button[cue="group"]:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: yellow;
    opacity: 0.3;
    z-index: 0;
  }
  button[cue="button"] {
    position: relative;
  }
  button[cue="button"]:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("./target.png");
    background-size: contain;
    background-position: center;
    background-color: rgba(255, 100, 100, 0.5);
    background-repeat: no-repeat;
    opacity: 0.4;
    z-index: 0;
  }
`;
