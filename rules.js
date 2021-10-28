/* rules.js
 * implement actions
 */

import { State } from "./state";

/**
 * functions for updating states
 */

export class Rules {
  Functions = {
    append: (/** @type {any} */ value) => (/** @type {any[]} */ old) =>
      [...old, value],
    empty: () => () => [],
    increment: (/** @type {number} */ value) => (/** @type {number} */ old) =>
      old + value,
    add_word: (value) => (old) => old ? old + " " + value : value,
    replace_last:
      (/** @type {string} */ newWord) => (/** @type {string} */ old) =>
        [...old.split(" ").slice(0, -1), newWord].join(" "),
  };

  /**
   * @param {Rule[]} rules
   * @param {State} state
   */
  constructor(rules, state) {
    this.rules = rules;
    this.state = state;
    this.last = {
      /** @type {Rule} */
      rule: null,
      /** @type {Object} */
      data: {},
      /** @type {string} */
      event: "",
      /** @type {string} */
      origin: "",
    };
  }

  /** translate an expression from Excel-like to Javascript
   * @param {string} expression
   * @return {string}
   */
  translate(expression) {
    /* translate the expression from the excel like form to javascript
       this is a hack, we should have a parser
    */
    // translate single = to ==
    let exp = expression.replaceAll(/(?<![=<>!])=/g, "==");
    // translate $name into state references
    exp = exp.replaceAll(/\$\w+/g, "state.get('$&')");
    // translate #name into field references
    exp = exp.replaceAll(/#(\w+)/g, "data.$1");

    console.log("eic", expression, exp);

    return exp;
  }

  /**
   * validate an expression string
   * @param {string} expression
   * @return {boolean}
   */
  validateExpression(expression) {
    const exp = this.translate(expression);
    try {
      Function(`return ${exp};`);
    } catch (error) {
      console.log("validate", error);
      return false;
    }
    return true;
  }

  /**
   * evaluate a string as an expression in a given context
   *
   * @param {string} expression - expression to evaluate
   * @param {Object} context - context for the evaluation
   * @return {boolean} value returned by the expression
   */
  evalInContext(expression, context) {
    const variables = Object.keys(context);
    const values = Object.values(context);
    const exp = this.translate(expression);
    console.log("eic", expression, exp);
    // console.log("variables", variables);
    const func = Function(...variables, `return ${exp}`);
    return func(...values);
  }

  /** @typedef {Object} eventQueueItem
   * @property {string} origin
   * @property {string} event
   */

  /** @type {eventQueueItem[]} */
  eventQueue = [];

  /** queue an event from within an event handler
   * @param {String} origin
   * @param {String} event
   */
  queueEvent(origin, event) {
    this.eventQueue.push({ origin, event });
  }

  /**
   * Attempt to apply a rule
   *
   * @param {string} origin - name of the originating element
   * @param {string} event - type of event that occurred, i.e.press
   * @param {Object} data - data associated with the event
   */
  applyRules(origin, event, data) {
    console.log({ origin, event, data });
    this.last = { origin, event, data, rule: null };
    // first for the event then for any that got queued.
    while (true) {
      const context = { ...this.Functions, state: this.state, data };
      console.log("applyRules", origin, event, data);
      console.log("context", context);
      for (const rule of this.rules) {
        console.log("rule", rule);
        if (origin != rule.origin || event != rule.event) {
          continue;
        }
        const result = rule.conditions.every((restriction) =>
          this.evalInContext(restriction, context)
        );
        if (result) {
          console.log("got it");
          this.last.rule = rule;
          const patch = Object.fromEntries(
            Object.entries(rule.updates).map(([$var, value]) => [
              $var,
              this.evalInContext(value, context),
            ])
          );
          console.log("patch", patch);
          this.state.update(patch);
          break;
        }
      }
      if (this.eventQueue.length == 0) break;
      ({ origin, event } = this.eventQueue.pop());
      data = {};
    }
  }

  /**
   * Pass event to rules
   *
   * @param {string} origin - name of the originating element
   * @param {Object} data - data associated with the event
   * @param {string} [event] - optional name for the event
   * @return {(event:Event) => void}
   */
  handler(origin, data, event) {
    return (e) => {
      let ev = event;
      if (e instanceof PointerEvent && e.altKey) {
        ev = "alt-" + event;
      }
      // console.log("handler", e, origin, event, data);
      this.applyRules(origin, ev || e.type, data);
    };
  }

  /** @param {(rule: Rule, index?: number) => any} func */
  map(func) {
    return this.rules.map(func);
  }

  /** @returns {Set<string>} */
  allStates() {
    const result = new Set();
    for (const rule of this.rules) {
      for (const condition of rule.conditions) {
        for (const [match] of condition.matchAll(/\$\w+/g)) {
          result.add(match);
        }
      }
      for (const [state, newValue] of Object.entries(rule.updates)) {
        result.add(state);
        for (const [match] of newValue.matchAll(/\$\w+/g)) {
          result.add(match);
        }
      }
    }
    return result;
  }
}
