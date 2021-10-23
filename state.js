import merge from "mergerino";

export class State {
  constructor(persistKey = "") {
    this.persistKey = persistKey;
    /** @type {Map<function, string[]>} */
    this.listeners = new Map();
    /** @type {Object} */
    this.values = {};
    if (this.persistKey) {
      /* persistence */
      const persist = window.localStorage.getItem(this.persistKey);
      if (persist) {
        this.values = JSON.parse(persist);
      }
    }
  }

  /** unified interface to state
   * @param {string} [name] - possibly dotted path to a value
   * @param {any} defaultValue
   * @returns {any}
   */
  get(name, defaultValue = undefined) {
    if (name && name.length) {
      return name
        .split(".")
        .reduce((o, p) => (o ? o[p] : defaultValue), this.values);
    } else {
      return undefined;
    }
  }

  /**
   * update the state with a patch and invoke any listeners
   *
   * @param {Object} patch - the changes to make to the state
   * @return {void}
   */
  update = (patch) => {
    const oldValues = this.values;
    this.values = merge(oldValues, patch);
    const changed = new Set();
    for (const key in this.values) {
      if (this.values[key] !== oldValues[key]) {
        changed.add(key);
      }
    }
    for (const key in oldValues) {
      if (!(key in this.values)) {
        changed.add(key);
      }
    }
    for (const [callback, names] of this.listeners) {
      if (!names.length || names.some((name) => changed.has(name))) {
        callback(changed);
      }
    }

    if (this.persistKey) {
      const persist = JSON.stringify(this.values);
      window.localStorage.setItem(this.persistKey, persist);
    }
  };
  /** observe - call this function if the named states change
   * @param {Function} callback
   * @param {String[]} names - state names to observe (use only first level)
   */
  observe(callback, ...names) {
    const old = this.listeners.get(callback) || [];
    // extract top level name from any that are dotted
    const topLevelNames = names.map((name) => name.split(".")[0]);
    this.listeners.set(callback, [...old, ...topLevelNames]);
  }

  /** define - add a named state to the global system state
   * @param {String} name - name of the state
   * @param {any} defaultValue - value if not already defined
   */
  define(name, defaultValue) {
    // handle dotted names
    const patch = {};
    let p = patch;
    let dots = name.split(".");
    let i = 0;
    for (; i < dots.length - 1; i++) {
      p = p[dots[i]] = {};
    }
    p[dots[i]] = (/** @type {any} */ currentValue) =>
      currentValue || defaultValue;
    this.update(patch);
  }
  /** interpolate
   * @param {string} input
   * @returns {string} input with $name replaced by values from the state
   */
  interpolate(input) {
    let result = input.replace(/(\$[a-zA-Z0-9_.]+)/, (_, name) =>
      this.get(name)
    );
    result = result.replace(/\$\{([a-zA-Z0-9_.]+)}/, (_, name) =>
      this.get("$" + name)
    );
    return result;
  }
  /**
   * Normalize tags
   *
   * @param {string[]} tags - Tags that must be in each row
   * @return {string[]} normalized tags as an array
   */
  normalizeTags(tags) {
    /** @type {string[]} tags */
    // normalize
    return tags
      .map((t) => (t.startsWith("$") && this.get(t)) || t)
      .filter((t) => t.length)
      .flat();
  }
}
