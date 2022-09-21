const logging = {
  local: false,
  remote: false,
};

let Name = "";

/** @param {string} name */
export function logInit(name) {
  Name = name;
}

let time = 0;

/** @param {any[]} args */
export function log(...args) {
  const current = performance.now();
  let delta = current - time;
  if (delta > 10000) {
    delta = 0;
    time = current;
  }
  if (logging.local) {
    console.log(delta.toFixed(3), ...args);
  }
  if (logging.remote) {
    fetch("/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([Name, delta, ...args]),
    });
  }
}
