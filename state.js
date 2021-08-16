import merge from "mergerino";

const LSKEY = "4.state";

var State = {};
const Listeners = new Set();

/** unified interface to state
 * @param {string} [name]
 * @returns {any} if name is defined, null otherwise
 */
export function state(name) {
  if (name && name.length) {
    return name in State ? State[name] : null;
  } else {
    return { ...State };
  }
}

/**
 * update the state with a patch and invoke any listeners
 *
 * @param {Object} patch - the changes to make to the state
 * @return {void}
 */
state.update = (patch) => {
  State = merge(State, patch);
  for (const element of [...Listeners].reverse()) {
    if (element.isConnected) element.render();
  }
  const persist = JSON.stringify(State);
  window.localStorage.setItem(LSKEY, persist);
};

/** state.observe - link this element to the state
 * @param {Object} element */
state.observe = (element) => {
  Listeners.add(element);
};

/** state.define - add a named state to the global system state
 * @param {String} name - name of the state
 * @param {any} default_value - value if not already defined
 */
state.define = (name, default_value) => {
  State = merge(State, {
    [name]: (/** @type {any} */ current_value) =>
      current_value || default_value,
  });
};

/** state.interpolate
 * @param {string} input
   @returns input with $name replaced by values from the state
*/
state.interpolate = (input) => {
  let result = input.replace(/(\$[a-zA-Z0-9_]+)/, (_, name) => state(name));
  result = result.replace(/\$\{([a-zA-Z0-9_]+)}/, (_, name) =>
    state("$" + name)
  );
  return result;
};

/** state.parseAction
 * @param {string} input
 * @param {Object} context
 */
state.parseAction = (input, context) => {
  return () => {
    const action = {};
    for (const match of input.matchAll(/(\$\w+)\s*=\s*(\$?\w+)/g)) {
      if (match[2].startsWith("$")) {
        action[match[1]] = state.interpolate(match[2]);
      } else {
        action[match[1]] = context[match[2]];
      }
    }
    state.update(action);
  };
};

/* persistence */
const persist = window.localStorage.getItem(LSKEY);
if (persist) {
  State = JSON.parse(persist);
}
