const logging = false;

let Name = "";
export function logInit(name) {
  Name = name;
}

export function log(...args) {
  if (logging) {
    console.log(...args);
    fetch("/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([Name, ...args]),
    });
  }
}
