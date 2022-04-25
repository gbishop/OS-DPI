/** A manager for access groups */

import { AccessMap } from "./access";

class MemberList extends Array {
  /**
   *
   * @param {function(any): string} key
   * @returns GroupList
   */
  groupBy(key) {
    const result = new GroupList();
    /** @type {Map<Object,MemberList>} */
    const groupMap = new Map();
    for (const member of this) {
      const k = key(member);
      // we got a key, check to see if we have a group
      let group = groupMap.get(k);
      if (!group) {
        // no group, create one and add it to the map and the result
        group = new MemberList(member);
        groupMap.set(key, group);
        result.push(group);
      } else {
        group.push(member);
      }
    }
    return result;
  }
  /**
   *
   * @param {function(any, any): number} compare
   * @returns GroupList
   */
  orderBy(compare) {
    return new MemberList([...this].sort(compare));
  }
}

class GroupList extends Array {
  /**
   *
   * @param {function(any, number, Array): boolean} predicate
   * @returns GroupList
   */
  filter(predicate) {
    return this.map((group) => group.filter(predicate));
  }

  /**
   * @param {function(any): string} key
   * @returns GroupList
   */
  groupBy(key) {
    return this.map((group) => group.groupBy(key));
  }

  /**
   * @param {function(any): string} key
   * @returns GroupList
   */
  orderBy(key) {
    return this.map((group) => group.orderBy(key));
  }
}

/** Select elements into groups
 * @param {string} query
 * @param {SelectOperator[]} operators
 * @returns {MemberList}
 */
function select(query, operators) {
  /** @type {MemberList} */
  let result = [...document.querySelectorAll(query)];

  for (const operator of operators) {
  }

  return result;
}
/** filter members
 * @param {MemberList} members
 * @param {function(Node): boolean} test
 * @returns {MemberList}
 */
function filter(members, test) {
  const result = [];
  for (const member of members) {
    if (member instanceof Node) {
      if (test(member)) {
        result.push(member);
      }
    } else {
      const group = { ...member };
      group.members = filter(group.members, test);
      if (group.members.length > 0) {
        result.push(group);
      }
    }
  }
  return result;
}

/** group members by the values return by the key function.
 * To the degree possible, leave values in the same place in the input
 * member list. Leave members without a key value where they are.
 *
 * This turns out to be more complicated than necessary. We're only using this in
 * "selects" thus the input will always be homogeneous, all Nodes or all groups.
 * This simplifies things considerably.
 *
 * @param {MemberList} members
 * @param {function(Object, Node): string|number} key
 * @returns {MemberList}
 */
function groupBy(members, key) {
  /** @type {MemberList} */
  const result = [];
  /** @type {Map<Object,Group>} */
  const groupMap = new Map();
  for (const member of members) {
    if (member instanceof Node) {
      const accessData = AccessMap.get(member);
      const k = key(accessData, member);
      if (k === undefined) {
        // no key, add it to the output
        result.push(member);
      } else {
        // we got a key, check to see if we have a group
        let group = groupMap.get(k);
        if (!group) {
          // no group, create one and add it to the map and the result
          group = { name: key.toString(), members: [member] };
          groupMap.set(key, group);
          result.push(group);
        } else {
          group.members.push(member);
        }
      }
    } else {
      // the member is a group. Recursively apply to it.
      /** @type {Group} */
      const group = { name: member.name, members: [] };
      group.members = groupBy(group.members, key);
      result.push(group);
    }
  }
  return result;
}

/** select operators */

/** The given field is not empty
 * @param {string} field
 * @returns {function (Node[]): Node[]}
 */
function notEmpty(field) {
  /** @param {Node[]} nodes */
  return (nodes) => nodes.filter((node) => AccessMap.get(node)[field]);
}

/** Test for equality between the field and the value
 * @param {string} field
 * @param {string} value
 * @returns {function (Node[]): Node[]}
 */
function equal(field, value) {
  /** @param {Node[]} nodes */
  return (nodes) => nodes.filter((node) => AccessMap.get(node)[field] == value);
}
class GroupManager {
  rules = [
    {
      operator: "group",
      name: "controls",
      cycle: 2,
      members: [
        {
          operator: "select",
          options: [{ notEmpty: "#controls" }, { orderBy: "#controls" }],
        },
      ],
    },
    {
      operator: "select",
      options: [{ "#name": "hp" }, { groupBy: "#row" }, { cycle: 2 }],
    },
    {
      operator: "select",
      options: [{ "#name": "morph" }, { cycle: 2 }],
    },
    {
      operator: "group",
      name: "completions",
      members: [
        {
          operator: "select",
          options: [{ "#name": "predict" }, { cycle: 2 }],
        },
      ],
    },
    {
      operator: "group",
      name: "letters",
      cycle: 2,
      members: [
        {
          operator: "select",
          options: [{ "#name": "kb" }, { groupBy: "#row" }, { cycle: 2 }],
        },
      ],
    },
    {
      operator: "select",
      options: [{ "#name": "num" }, { cycle: 2 }],
    },
  ];
}
