/**
 * Can I make smart properties that can compute their value like spreadsheet cells?
 *
 * Needed:
 *   Integer
 *   String select
 *   String
 *   Expression
 *   Field
 *   Array
 */

import Globals from "../globals";
import { evalInContext, Functions } from "../eval";

class Prop {
  props = {};
  constructor() {
    console.log("props", this.props);
  }
  toJson() {
    return "";
  }
  fromJson(json = "") {}
}

class P2 extends Prop {
  props = { a: 1 };
}

const foo = new P2();

class ArrayOfProp {
  /**
   * @param  {Prop[]} values
   */
  constructor(...values) {
    this.values = values;
  }
}

/**
 * @template E
 * @param {string} given
 * @param {function(string): E} validator
 * @returns {function(Object): E}
 */
function evaluator(given, validator) {
  if (given.startsWith("=")) {
    return (data = {}) =>
      validator(
        evalInContext(given, { ...Functions, state: Globals.state, data })
      );
  } else {
    const value = validator(given);
    return () => value;
  }
}

class Field {
  /** @param {string} given
   *  @returns {string}
   */
  Validator(given) {
    if (!given.match(/#\w+$/)) {
      throw new Error(`Invalid field (${given})`);
    }
    return given;
  }
  /** @param {string} given */
  constructor(given) {
    /** @type {string} */
    this.value = this.Validator(given);
  }
}

class Integer {
  /** @param {string} given
   *  @returns {number}
   */
  Validator(given) {
    if (!given.match(/\d+$/)) {
      throw new Error(`Invalid number (${given})`);
    }
    return parseInt(given);
  }
  /** @param {string} given */
  constructor(given) {
    this.given = given;
    this.data = {};
    this.evaluator = evaluator(given, this.Validator);
  }
  /** @returns {number} */
  get value() {
    return this.evaluator(this.data);
  }
}
