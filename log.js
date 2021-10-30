const logging = {
  local: false,
  remote: false,
};

let Name = "";

/** @param {string} name */
export function logInit(name) {
  Name = name;
}

/** @param {any[]} args */
export function log(...args) {
  if (logging.local) {
    console.log(...args);
  }
  if (logging.remote) {
    fetch("/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([Name, ...args]),
    });
  }
}
