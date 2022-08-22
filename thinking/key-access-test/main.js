import "./style.css";

/** A table defining how to handle events
 */
/**
 * @typedef {KeyboardEvent & { target: HTMLInputElement } } InputEventWithTarget
 * @typedef { (event: InputEventWithTarget) => boolean } Condition
 * @typedef { Condition[] } Conditions
 * @typedef { (target: HTMLElement) => any } Action
 * @typedef { Action[] } Actions
 *
 *  Each table entry is a list of conditions that must be true and a list of actions.
 * @type { [ Conditions, Actions ][] }
 */
// stop prettier from rearranging my table
// prettier-ignore
const KeyHandlerTable = [
  /*  Conditions                                                  Actions  */
  [ [onComponent, key("F2")],                                     [enter] ],
  [ [key("F2")],                                                  [exit] ],
  [ [key("ArrowRight", "ArrowLeft"), hasAttr('arrows', "1") ],    [pass] ],
  [ [key("Enter"), hasAttr('arrows', "0")],                       [setAttr('arrows', "1")]],
  [ [key("Enter"), hasAttr('arrows', "1")],                       [setAttr('arrows', "0")]],
  [ [key("ArrowRight", "ArrowDown")],                             [nextChild] ],
  [ [key("ArrowLeft", "ArrowUp")],                                [previousChild] ],
];

// add the event handler to every Component
for (const component of document.querySelectorAll("fieldset")) {
  component.addEventListener("keydown", handleKey);
}

/** @param {InputEventWithTarget} event */
function handleKey(event) {
  Log(event);
  for (const handler of KeyHandlerTable) {
    const [conditions, actions] = handler;
    if (!conditions.every((condition) => condition(event))) continue;
    if (!actions.some((action) => action(event.target))) {
      event.preventDefault();
    }

    break;
  }
}

/**
 * There are 2 kinds of focusable places: Components and Inputs.
 * Components consist of Inputs and nested Components.
 * Every place you can focus has a tabindex.
 */

/**
 * TODO: What about Inputs that require Arrows (like Select)? How to handle?
 *
 * Wow! Maybe it just works? Try the Select in the example.
 *
 * OK. I've hacked an attribute to allow arrow keys on controls that need
 * them.
 *
 * This FancyTree example is interesting:
 * https://wwwendt.de/tech/fancytree/demo/#sample-multi-ext.html
 *
 */

/* Predicates */

/**
 * Determine if the currently focused thing is a Component
 * @param {InputEventWithTarget} event
 * @returns {boolean}
 * */
function onComponent({ target }) {
  // using fieldset for components in this test
  return target["tagName"] == "FIELDSET";
}

/**
 * Determine if the currently focused thing is inside Component
 * @param {InputEventWithTarget} thing
 * @returns {boolean}
 * */
function inComponent({ target }) {
  // using fieldset for components in this test
  return target.parentElement.closest("fieldset") != null;
}

/**
 * Determine if the currently focused thing is an Input
 * @param {KeyboardEvent} thing
 * @returns {boolean}
 * */
function onInput({ target }) {
  // hack assuming if it isn't a component it must be an input
  return target["tagName"] != "fieldset";
}

/**
 * Test if the event used any of the given keys
 * @param {string[]} keys
 * @returns {(event: InputEventWithTarget) => boolean}
 */
function key(...keys) {
  return (/** @type {KeyboardEvent} */ event) => {
    for (const k of keys) {
      if (event.key == k) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Test if the target has data with the given value
 * @param {string} name
 * @param {string} value
 * @returns {(event: InputEventWithTarget) => boolean}
 */
function hasAttr(name, value) {
  return (/** @type {InputEventWithTarget} */ event) => {
    return event.target.getAttribute(name) == value;
  };
}

/* Helpers */

/** @param {Event} event */
function Log(event) {
  const target = /** @type {HTMLElement} */ (event.target);
  console.log(event.type, target, target.tagName, event["key"]);
}

/** @param {HTMLElement} node */
function getChildren(node) {
  // should exclude children of nested fieldsets
  const children = [...node.querySelectorAll("[tabindex]")].filter((child) => child.parentElement.closest('fieldset') === node);
  console.log({children});
  return /** @type {HTMLElement[]} */ (children);
}

/** @param {HTMLElement} node */
function getParent(node) {
  return node.parentElement.closest("fieldset") || document.body;
}

/** @param {HTMLElement} node
 * @returns {{peers: HTMLElement[], index: number}}
 * */
function getPeers(node) {
  const peers = getChildren(getParent(node));
  const index = peers.indexOf(node);
  return { peers, index };
}

/**
 * @param {HTMLElement} from
 * @param {HTMLElement} to
 * */
function focusFromTo(from, to) {
  from.setAttribute("tabindex", "-1");
  to.setAttribute("tabindex", "0");
  to.focus();
}

/* Actions */

/** @param {HTMLElement} target */
function nextChild(target) {
  const { peers, index } = getPeers(target);
  if (index < peers.length - 1) {
    const next = peers[index + 1];
    focusFromTo(target, next);
  }
}

/** @param {HTMLElement} target */
function previousChild(target) {
  const { peers, index } = getPeers(target);
  if (index > 0) {
    const next = peers[index - 1];
    focusFromTo(target, next);
  }
}

/** @param {HTMLElement} target */
function enter(target) {
  const children = getChildren(target);
  focusFromTo(target, children[0]);
}

/** @param {HTMLElement} target */
function exit(target) {
  const parent = getParent(target);
  focusFromTo(target, parent);
}

function pass() {
  return true;
}

/**
 * Return function to set the attribute on the target
 * @param {string} attribute
 * @param {string} value
 * @returns {(target: HTMLElement) => any}
 */
function setAttr(attribute, value) {
  return (/** @type {HTMLElement} */ target) => {
    target.setAttribute(attribute, value);
  };
}
