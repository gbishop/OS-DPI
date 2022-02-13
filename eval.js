import expressions from "angular-expressions";

export const Functions = {
  append: (/** @type {any} */ value) => (/** @type {any[]} */ old) =>
    [...(old || []), value],
  empty: () => () => [],
  increment: (/** @type {number} */ value) => (/** @type {number} */ old) =>
    old + value,
  add_word: (/** @type {string} */ value) => (/** @type {string} */ old) =>
    old ? old + " " + value : value,
  add_letter: (/** @type {string} */ value) => (/** @type {string} */ old) =>
    old ? old + value : value,
  replace_last:
    (/** @type {string} */ newWord) => (/** @type {string} */ old) =>
      [...(old || "").split(" ").slice(0, -1), newWord].join(" "),
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
