/* rules.js
 * implement actions
 */

import { state } from "./state.js";

const exampleRule = {
  origin: "a-grid",
  event: "press",
  restrictions: ["foo < bar", "$s == 'ok'"],
  actions: ["$s = 'nok'", "say('hello')"],
};

/**
 * @typedef {typeof exampleRule} Rule
 */

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
    const result = rule.restrictions.every((restriction) =>
      evalInContext(restriction, context)
    );
    if (result) {
      // console.log("got it");
      context.$ = {};
      for (const action of rule.actions) {
        const a = action.replace(/(\$\w+)\s*=/, "$$.$1 =");
        // console.log("action", action, a);
        evalInContext(a, context);
      }
      // console.log("$", context.$);
      if (Object.keys(context.$)) {
        state.update(context.$);
      }
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
