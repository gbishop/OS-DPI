const $ = Proxy;

const {apply: a, bind: b, call: c} = Function;
const apply = c.bind(a);
const bind = c.bind(b);
const call = c.bind(c);

const callerHandler = {
  get(target, name) {
    return bind(c, target[name]);
  }
};

/** @type {<T>(target:T) => target} A Proxy for a target with secured callers */
const caller = target => new $(target, callerHandler);

const handler = {
  get(target, name) {
    return bind(target[name], target);
  }
};

/** @type {<T>(target:T) => target} A Proxy for a target with automatic bound methods. */
const bound = target => new $(target, handler);

const {
  assign,
  defineProperties,
  freeze,
  getOwnPropertyDescriptor,
  getOwnPropertyDescriptors,
  getPrototypeOf
} = bound(Object);

const {hasOwnProperty} = caller({});

const {concat, includes, join, reduce, unshift} = caller([]);

const {species} = Symbol;

const handler$1 = {
  get(target, name) {
    const Native = target[name];
    class Secure extends Native {}

    const proto = getOwnPropertyDescriptors(Native.prototype);
    delete proto.constructor;
    freeze(defineProperties(Secure.prototype, proto));

    const statics = getOwnPropertyDescriptors(Native);
    delete statics.length;
    delete statics.prototype;
    statics[species] = {value: Secure};
    return freeze(defineProperties(Secure, statics));
  }
};

/** @type {<T>(target:T) => target} A Proxy for a target to secure */
const secure = target => new $(target, handler$1);

const globals = secure(globalThis);

const {
  Map,
  WeakMap
} = globals;

const map = new Map;

const {
  ownKeys
} = bound(Reflect);

const id = Symbol('extender');

/**
 * Extend any object through weakly referenced, isolated, self-contained,
 * behaviors.
 * @template {object} P The prototype reference used to augment the target.
 * @param {P} proto The prototype reference used to augment the target.
 * @returns {<T>(target:T) => T & P} A function able to augment/extend once any target.
 */
const extender = proto => {
  const keys = ownKeys(proto);
  const overrides = new Map;
  const {init} = proto;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'init')
      continue;
    const wm = new WeakMap;
    const descriptor = getOwnPropertyDescriptor(proto, key);
    if (includes(ownKeys(descriptor), 'value')) {
      const {value} = descriptor;
      overrides.set(key, typeof value === 'function' ?
        target => {
          if (!wm.has(target)) {
            const $ = bind(value, target);
            wm.set(target, {get: () => $});
          }
          return wm.get(target);
        } :
        target => {
          if (!wm.has(target)) {
            let $ = value;
            wm.set(target, {
              get: () => $,
              set: value => { $ = value; }
            });
          }
          return wm.get(target);
        }
      );
    }
    else {
      const {get, set} = descriptor;
      overrides.set(key, target => {
        if (!wm.has(target)) {
          wm.set(target, {
            get: () => call(get, target),
            set: value => { call(set, target, value); }
          });
        }
        return wm.get(target);
      });
    }
  }

  const handler = {
    get: (target, key) => key === id ? target : (
      overrides.has(key) ?
        overrides.get(key)(target).get() :
        target[key]
    ),
    set: (target, key, value) => {
      if (overrides.has(key))
        overrides.get(key)(target).set(value);
      else
        target[key] = value;
      return true;
    }
  };

  const known = new WeakMap;

  return function (target) {
    const wrap = target[id] || target;
    if (!known.has(wrap)) {
      known.set(wrap, new $(wrap, handler));
      if (init)
        call(init, wrap);
    }
    return known.get(wrap);
  };
};

// const source = {noMagic() {}};
// const Magic = extender(source);
// const proxy = Magic({yesMagic(){}});
// proxy. // <-- should hint both no/yesMagic(){}

export { extender };
