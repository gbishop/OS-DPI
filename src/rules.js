/* rules.js
 * implement actions
 */

import { evalInContext, Functions } from "./eval";
import Globals from "./globals";

/**
 * functions for updating states
 */

export class Rules {
  /**
   * @param {Rule[]} rules
   */
  constructor(rules) {
    this.rules = rules;
    this.last = {
      /** @type {Rule|Null} */
      rule: null,
      /** @type {Object} */
      data: {},
      /** @type {string} */
      event: "",
      /** @type {string} */
      origin: "",
    };
    this.doInit();
  }

  /** run the init rule if any
   */
  doInit() {
    this.applyRules("", "init", {});
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
    this.last = { origin, event, data, rule: null };
    // first for the event then for any that got queued.
    for (;;) {
      const context = { ...Functions, state: Globals.state, data };
      for (const rule of this.rules) {
        if (
          (origin != rule.origin && rule.origin != "*") ||
          event != rule.event
        ) {
          continue;
        }
        const result = rule.conditions.every((restriction) =>
          evalInContext(restriction, context),
        );
        if (result) {
          this.last.rule = rule;
          const patch = Object.fromEntries(
            Object.entries(rule.updates).map(([$var, value]) => [
              $var,
              evalInContext(value, context),
            ]),
          );
          Globals.state.update(patch);
          break;
        }
      }
      if (this.eventQueue.length == 0) break;
      const item = this.eventQueue.pop();
      if (item) {
        origin = item.origin;
        event = item.event;
      }
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
      this.applyRules(origin, ev || e.type, data);
    };
  }

  /** @param {(rule: Rule, index: number) => any} func */
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
