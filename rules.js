/* rules.js
 * implement actions
 */

import { state } from "./state.js";

/**
 * functions for updating states
 */

/**
 * @typedef {Object} Rule
 * @property {string} origin
 * @property {string} event
 * @property {string[]} conditions
 * @property {Object<string, string>} updates
 */

/** @type {Rule} */
const exampleRule = {
  origin: "a-grid",
  event: "press",
  conditions: ["foo < bar", "$s == 'ok'"],
  updates: {
    $s: "$t", // set the state variable $s to the value of $t
    $foo: "append(icon)", // append the value of icon to the list $foo
    $bar: "empty()", // empty the list $bar
    $count: "increment(1)", // increment the value of $count by 1
  },
};

/**
 * evaluate a string as an expression in a given context
 *
 * @param {string} expression - expression to evaluate
 * @param {Object} context - context for the evaluation
 * @return {boolean} value returned by the expression
 */
function evalInContext(expression, context) {
  const variables = Object.keys(context);
  const values = Object.values(context);
  // console.log("eic", expression, variables, values);
  const func = Function(...variables, `return ${expression}`);
  return func(...values);
}

/** @type {Rule[]} Rules */
export let Rules = [];

/**
 * Set the rules from an external object
 *
 * @param {Rule[]} rules - Array of rules
 * @return {void}
 */
export function set(rules) {
  Rules = rules;
}

/**
 * Attempt to apply a rule
 *
 * @param {string} origin - name of the originating element
 * @param {string} event - type of event that occurred, i.e.press
 * @param {Object} data - data associated with the event
 * @return {boolean} returns true if rule was applied
 */
function applyRules(origin, event, data) {
  const context = { ...state(), ...data };
  // console.log("applyRules", origin, event, data);
  // console.log("context", context);
  for (const rule of Rules) {
    // console.log("rule", rule);
    if (origin != rule.origin || event != rule.event) {
      continue;
    }
    const result = rule.conditions.every((restriction) =>
      evalInContext(restriction, context)
    );
    if (result) {
      // console.log("got it");
      context.append = (value) => (old) => [...old, value];
      context.empty = () => () => [];
      context.increment = (value) => (old) => old + value;
      const patch = Object.fromEntries(
        Object.entries(rule.updates).map(([$var, value]) => [
          $var,
          evalInContext(value, context),
        ])
      );
      // console.log("patch", patch);
      state.update(patch);
      return result;
    }
  }
  // console.log("no rule");
  return false;
}

/**
 * Pass event to rules
 *
 * @param {string} origin - name of the originating element
 * @param {Object} data - data associated with the event
 * @param {string} [event] - optional name for the event
 * @return {(event:Event) => void}
 */
export function handler(origin, data, event) {
  return (e) => {
    // console.log("handler", e, origin, event, data);
    applyRules(origin, event || e.type, data);
  };
}
