import * as uhtml from "uhtml";

export function render() {
  const UI = document.querySelector("div#UI");
  const children = [...UI.children].map((child) => child.designer());
  uhtml.render(
    document.querySelector("div#designer"),
    uhtml.html`<ul>
      ${children}
    </ul>`
  );
}
