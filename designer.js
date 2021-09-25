import { html, render } from "uhtml";
import ABase from "./components/a-base";

/** @param {ABase | Element} element
 */
function designer(element) {
  if (element instanceof ABase) {
    const controls = element.props.map((name) => propControl(element, name));
    return html`<details
        ontoggle=${(event) => element.designerHighlight(event.target.open)}
      >
        <summary>${element.designerName}</summary>
        <table>
          <tbody>
            ${controls.map(
              ({ name, control, id }) =>
                html`<tr>
                  <td><label for=${id}>${name}</label></td>
                  <td>${control}</td>
                </tr>`
            )}
          </tbody>
        </table>
      </details>
      <ul>
        ${element.Children.map((child) => html`<li>${designer(child)}</li>`)}
      </ul>`;
  } else {
    return html`${element.tagName}
      <ul>
        ${[...element.children].map(
          (child) => html`<li>${designer(child)}</li>`
        )}
      </ul>`;
  }
}

function propControl(element, name) {
  let type = "text";
  let value = element[name];
  // this is a hack, we need types
  if (name === "background") {
    type = "color";
  } else if (typeof element[name] === "number" || name == "scale") {
    type = "number";
  }
  const id = `${element.id}-${name}`;
  const control =
    type == "color"
      ? html`<color-input
          id=${id}
          value=${value}
          onchange=${(event) => propUpdate(element, name, event)}
        />`
      : html`<input
          id=${id}
          type=${type}
          value=${value}
          onchange=${(event) => propUpdate(element, name, event)}
        />`;
  return { name, control, id };
}

function propUpdate(element, name, event) {
  let value = event.target.value;
  if (typeof element[name] === "number") {
    value = parseInt(value);
    if (isNaN(value)) value = 0;
  }
  element[name] = value;
  element.render();
  designerRender();
}

export function designerRender() {
  const UI = document.querySelector("div#UI");
  render(
    document.querySelector("div#designer"),
    html`${[...UI.children].map((child) => designer(child))}`
  );
}
