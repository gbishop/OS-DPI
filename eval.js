import expressions from "angular-expressions";
import Globals from "./globals";

/** @param {function(string, string): string} f */
function updateString(f) {
  /** @param {string} value */
  return function (value) {
    /** @param {string | undefined} old */
    return function (old) {
      return f(old || "", value);
    };
  };
}
/** @param {function(number, number): number} f */
function updateNumber(f) {
  /** @param {number} value */
  return function (value) {
    /** @param {number | undefined} old */
    return function (old) {
      return f(old || 0, value);
    };
  };
}
export const Functions = {
  increment: updateNumber((old, value) => old + value),
  add_word: updateString((old, value) => old + value + " "),
  add_letter: updateString((old, value) => old + value),
  complete: updateString((old, value) => {
    if (old.length == 0 || old.endsWith(" ")) {
      return old + value;
    } else {
      return old.replace(/\w+$/, value);
    }
  }),
  replace_last: updateString((old, value) => old.replace(/\w*\s*$/, value)),
  replace_last_letter: updateString((old, value) => old.slice(0, -1) + value),
  random: (/** @type {string} */ arg) => {
    let args = arg.split(",");
    return args[Math.floor(Math.random() * args.length)];
  },
};

/**
 * Translate an expression from Excel-like to Javascript
 *
 * @param {string} expression
 * @returns {string}
 */
function translate(expression) {
  /* translate the expression from the excel like form to javascript */
  // translate single = to ==
  let exp = expression.replaceAll(/(?<![=<>!])=/g, "==");
  // translate words
  exp = exp.replaceAll(/[$#]\w+/g, "access('$&')");
  return exp;
}

/**
 * Validate an expression string
 *
 * @param {string} expression
 * @returns {boolean}
 */
export function validateExpression(expression) {
  try {
    const exp = translate(expression);
    expressions.compile(exp);
  } catch (error) {
    console.error("validate", error);
    return false;
  }
  return true;
}

/**
 * Cleanup access to state and data
 *
 * @param {State} state
 * @param {Row} data
 * @returns {function(string): any}
 */
export function access(state, data) {
  return function (name) {
    if (!name) return "";
    if (state && name.startsWith("$")) {
      return state.get(name);
    }
    if (data && name.startsWith("#")) {
      const r = data[name.slice(1)];
      if (r == null) return "";
      return r;
    }
    return "";
  };
}

/** @param {string} expression
 *
 * This could throw an error which we should catch and report.
 * */
export function compileExpression(expression) {
  const te = translate(expression);
  const exp = expressions.compile(te);
  /** @param {Object} context */
  return (context) =>
    exp({ ...Functions, access: access(Globals.state, context), ...context });
}

/**
 * Evaluate a string as an expression in a given context
 *
 * @param {string} expression - Expression to evaluate
 * @param {Object} context - Context for the evaluation
 * @returns {any} Value returned by the expression
 */
export function evalInContext(expression, context) {
  try {
    const te = translate(expression);
    const exp = expressions.compile(te);
    return exp({ ...context, access: access(context.state, context.data) });
  } catch (e) {
    console.error(e);
    return null;
  }
}
