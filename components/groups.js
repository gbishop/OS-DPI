/** A manager for access groups */

import { AccessMap } from "./access";

class ANode extends Object {
  constructor(node) {
    super();
    Object.assign(this, AccessMap.get(node), { node });
  }
}

class ANodeList extends Array {
  /** @param {...ANode} values */
  constructor(...values) {
    super(...values);
  }
}

/** @typedef {Object} GroupProperties */

class AGroup {
  /**
   * @param {ATargetList} members
   * @param {Object} properties
   */
  constructor(members, properties) {
    this.members = members;
    this.properties = properties;
  }
}

class AGroupList extends Array {
  /** @param {AGroup[]} values */
  constructor(values) {
    super(...values);
  }

  /**
   *
   * @param {function(any, number, Array): any} callbackfn
   */
  map(callbackfn) {
    return new AGroupList(super.map(callbackfn));
  }
}

class AGroupBuilder {
  /**
   * @param {ABuilder[]} builders
   * @param {Object} properties
   */
  constructor(builders, properties) {
    this.builders = builders;
    this.properties = properties;
  }
  /**
   * Build a group from the output of the selectors applied to the input
   * @param {ATarget[]} input
   * @returns {ATarget}
   */
  apply(input) {
    const members = [].concat(
      ...this.builders.map((builder) => builder.apply(input))
    );
    return [new AGroup(members, this.properties)];
  }
}

class ASelector {
  /**
   *
   * @param {SelectionOperator[]} selectionOperators
   */
  constructor(selectionOperators) {
    this.operators = selectionOperators;
  }
  /**
   * Apply the selector to the nodes to produce an array of nodes
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
 * @typedef {ANode|AGroup} ATarget
 *
 * @typedef {ANodeList|AGroupList} ATargetList
 *
 * @typedef {function(ATarget[]): ATarget[]} SelectionOperator
 *
 * @typedef {ASelector|AGroupBuilder} ABuilder
 *
 */

class AccessGroupManager {
  /** @type {ANode[]} */
  annotatedNodes = [];
  /**
   * targets are buttons or groups
   * @type {ATarget[]}
   */
  targets = []; // work out the type later
  /**
   * builders are the rules for constructing targets from the nodes
   *
   * @type {ABuilder[]}
   */
  builders = [];

  /**
   * Collect the nodes from the DOM and process them into targets
   */
  refresh() {
    // gather the buttons from the UI
    this.annotatedNodes = [];
    for (const node of document.querySelectorAll("#UI button")) {
      const accessInfo = AccessMap.get(node);
      if (accessInfo) {
        this.annotatedNodes.push({ ...accessInfo, node });
      }
    }
    console.log("nodes", this.annotatedNodes);
    // apply the builders to get the targets
    this.targets = [].concat(
      ...this.builders.map((builder) => builder.apply(this.annotatedNodes))
    );
    console.log("targets", this.targets);
  }

  /**
   *
   * @param {ABuilder[]} builders
   */
  setBuilders(builders) {
    this.builders = builders;
    this.refresh();
  }
}
/**
 *
 * @param {function(ANodeList): ATargetList} simpleOperator
 * @returns {function(ATargetList): ATargetList}
 */

function makeHigherOrderOperator(simpleOperator) {
  /** @param {ATargetList} input */
  function hoo(input) {
    console.log("hoo", input);
    if (input instanceof AGroupList) {
      const r = new AGroupList(
        input.map((group) => new AGroup(hoo(group.members), group.properties))
      );
      return r;
    } else {
      const r = simpleOperator(input);
      return r;
    }
  }
  return hoo;
}

function makeFilterOperator(predicate) {
  return makeHigherOrderOperator((input) => input.filter(predicate));
}

function makeOrderByOperator(key) {
  return makeHigherOrderOperator((input) => [...input].sort(key));
}

/**
 *
 * @param {ANode[]} input
 * @param {function(ANode): string} key
 * @param {function(ANode): Object} properties
 * @returns {AGroup[]}
 */
function groupBy(input, key, properties) {
  const result = [];
  /** @type {Map<Object,AGroup>} */
  const groupMap = new Map();
  for (const node of input) {
    const k = key(node);
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

function makeGroupByOperator(key, properties) {
  return makeHigherOrderOperator((input) => groupBy(input, key, properties));
}

export function testIt() {
  const builders = [
    new ASelector([makeFilterOperator((node) => node.label == "Speak")]),
  ];
  console.log("builders", builders);
  const agm = new AccessGroupManager();
  agm.setBuilders(builders);
}
