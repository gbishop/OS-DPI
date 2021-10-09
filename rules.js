/* rules.js
 * implement actions
 */

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

export class Rules {
  Functions = {
    append: (value) => (old) => [...old, value],
    empty: () => () => [],
    increment: (value) => (old) => old + value,
  };

  /**
   * @param {Rule[]} rules
   * @param {import('./state').State} state
   */
  constructor(rules, state) {
    this.rules = rules;
    this.state = state;
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
    // console.log("eic", expression);
    // console.log("variables", variables);
    const func = Function(...variables, `return ${expression}`);
    return func(...values);
  }

  /** @type {{origin: string, event: string}[]} */
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
    // first for the event then for any that got queued.
    while (true) {
      const context = { ...this.Functions, ...this.state.values, ...data };
      // console.log("applyRules", origin, event, data);
      // console.log("context", context);
      for (const rule of this.rules) {
        // console.log("rule", rule);
        if (origin != rule.origin || event != rule.event) {
          continue;
        }
        const result = rule.conditions.every((restriction) =>
          this.evalInContext(restriction, context)
        );
        if (result) {
          // console.log("got it");
          const patch = Object.fromEntries(
            Object.entries(rule.updates).map(([$var, value]) => [
              $var,
              this.evalInContext(value, context),
            ])
          );
          // console.log("patch", patch);
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
}

export default Rules;
