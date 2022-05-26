/** A manager for access groups */

import css from "ustyler";
import { AccessMap } from "./access";

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
   * @param {Selector[]} selectors
   * @param {GroupProperties} properties
   */
  constructor(selectors, properties) {
    super();
    this.selectors = selectors;
    this.properties = properties;
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
   * @param {Operator[]} selectionOperators
   */
  constructor(selectionOperators) {
    super();
    this.operators = selectionOperators;
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
   * @param {Selector[]} selectors
   */
  setSelectors(selectors) {
    this.selector = new GroupSelector(selectors, {});
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

  /**
   *
   * @param {Context} context
   */
  activate(context) {
    let current = this.current;
    if (current instanceof Button) {
      const name = current.data.name;
      if ("onClick" in current.data) {
        current.data.onClick();
      } else {
        context.rules.applyRules(name, "press", current.data);
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
  constructor(predicate) {
    super();
    this.predicate = predicate;
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
   * @param {function(Target): string} key
   */
  constructor(key) {
    super();
    this.key = key;
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
   * @param {function(Target): string} key
   * @param {function(Target): Object} properties
   */
  constructor(key, properties) {
    super();
    this.key = key;
    this.properties = properties;
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
        group = new Group([node], this.properties(node));
        groupMap.set(k, group);
        result.push(group);
      } else {
        group.members.push(node);
      }
    }
    return result;
  }
}

export function createSelectors() {
  /** @type {Selector[]} */
  const selectors = [
    new GroupSelector(
      [
        new SimpleSelector([
          new FilterOperator((node) => node.data?.controls),
          new OrderByOperator((node) => node.data?.controls),
        ]),
      ],
      { label: "controls" }
    ),
    new SimpleSelector([
      new FilterOperator((node) => !node.data?.controls),
      new GroupByOperator(
        (node) => node.data.name,
        (node) => ({ label: node.data.name })
      ),
      new GroupByOperator(
        (node) => node.data.row || 0,
        (node) => ({
          label: `row ${node.data.row}`,
        })
      ),
    ]),
  ];
  return selectors;
}

/* thinking about the stored representation */
const storedAccess = {
  selectors: [
    {
      selectors: [
        [
          { filter: { operator: "not empty", field: "#controls" } },
          { orderBy: { field: "#controls" } },
        ],
      ],
      properties: {
        label: "controls",
        cycle: 2,
      },
    },
    [
      { filter: { operator: "empty", field: "#controls" } },
      { groupBy: "#name", properties: { label: "#name", cycle: 2 } },
      { groupBy: "#row", properties: { label: "row #row" } },
    ],
  ],
  properties: {
    label: "top level",
    cycle: 2,
  },
};

// hack some css so I can see the groups
css`
  button[cue="group"] {
    position: relative;
    border-color: yellow;
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
