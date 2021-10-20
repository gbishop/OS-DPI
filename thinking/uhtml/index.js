import { render, html } from "https://unpkg.com/uhtml?module";

let index = 0;

const data = [
  {
    name: "foo",
    value: 12,
  },
  {
    name: "bar",
    value: 1,
  },
  {
    name: "baz",
    value: 2,
  },
];

function main() {
  const { name, value } = data[index];
  render(
    document.body,
    html` <button
        onclick=${() => {
          index = (index + 1) % data.length;
          main();
        }}
      >
        Next
      </button>
      <label for="inp">${name}</label>
      <input id=${name} type="number" value=${value} />`
  );
}

main();
