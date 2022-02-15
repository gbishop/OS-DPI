import expressions from "angular-expressions";

/** @param {function(string, string): string} f */
function updateString(f) {
  /** @param {string} value */
  return function(value) {
    /** @param {string|undefined} old */
    return function(old) {
      return f(old || "", value);
    }
  }
}
/** @param {function(number, number): number} f */
function updateNumber(f) {
  /** @param {number} value */
  return function(value) {
    /** @param {number|undefined} old */
    return function(old) {
      return f(old || 0, value);
    }
  }
}
export const Functions = {
  increment: updateNumber((old, value) => old + value),
  add_word: updateString((old, value) => old + value + " "),
  add_letter: updateString((old, value) => old + value),
  replace_last: updateString((old, value) => old.replace(/\w+\s*$/, value)),
  replace_last_letter: updateString((old, value) => old.slice(0, -1) + value),
};

/** translate an expression from Excel-like to Javascript
 * @param {string} expression
 * @return {string}
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
 * validate an expression string
 * @param {string} expression
 * @return {boolean}
 */
export function validateExpression(expression) {
  try {
    const exp = translate(expression);
    expressions.compile(exp);
  } catch (error) {
    console.log("validate", error);
    return false;
  }
  return true;
}

/** Cleanup access to state and data
 * @param {State} state
 * @param {Row} data
 * @returns {function(string): any}
 */
function access(state, data) {
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

/**
 * evaluate a string as an expression in a given context
 *
 * @param {string} expression - expression to evaluate
 * @param {Object} context - context for the evaluation
 * @return {any} value returned by the expression
 */
export function evalInContext(expression, context) {
  const te = translate(expression);
  const exp = expressions.compile(te);
  return exp({ ...context, access: access(context.state, context.data) });
}
