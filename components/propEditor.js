import { html } from "uhtml";
import { validateColor, getColor } from "./style";
import { textInput } from "./input";

/**
 * @param {string} name
 * @param {any} value
 * @param {PropertyInfo} info
 * @param {Context} context
 * @param {(name: string, value: any) => void} [hook]
 */
export function propEditor(name, value, info, context, hook) {
  function propUpdate({ target }) {
    const name = target.name;
    const value = target.value;
    console.log({ name, value });
    hook(name, value);
  }
  const label = html`<label for=${name}>${info.name}</label>`;
  switch (info.type) {
    case "string":
      return html`<label for=${name}>${info.name}</label>
        <input
          type="text"
          id=${name}
          name=${name}
          .value=${value}
          onchange=${propUpdate}
          autocomplete="off"
        />`;

    case "number":
      return html`${label}
        <input
          type="number"
          id=${name}
          name=${name}
          .value=${value}
          onchange=${propUpdate}
          autocomplete="off"
        />`;

    case "color":
      return html`<label for=${name}>${info.name}</label>
        <div class="color-input">
          <input
            id=${name}
            type="text"
            name=${name}
            .value=${value}
            list="ColorNames"
            onchange=${(/** @type {InputEventWithTarget} */ event) =>
              validateColor(event) && propUpdate(event)}
            autocomplete="off"
          />
          <div
            class="swatch"
            style=${`background-color: ${getColor(value)}`}
          ></div>
        </div>`;

    case "select":
      return html`<label for=${name}>${info.name}</label>
        <select id=${name} name=${name} onchange=${propUpdate}>
          ${info.values?.map(
            (ov) =>
              html`<option value=${ov} ?selected=${ov == value}>${ov}</option>`
          )}
        </select>`;

    case "state":
      const { tree, rules } = context;
      let states = new Set([...tree.allStates(), ...rules.allStates()]);
      return textInput({
        type: "text",
        name,
        label: info.name,
        value,
        context,
        validate: (value) => (value.match(/^\$\w+$/) ? "" : "Invalid state"),
        update: hook,
        suggestions: states,
      });

    case "tags": {
      const strings = value.length ? [...value] : [""];
      return html`${strings.map((string, index) => {
          const id = `${name}_${index}`;
          const hidden = index != 0;
          const label = index != 0 ? `${info.name} ${index + 1}` : info.name;
          return html`
            <label for=${id} ?hidden=${hidden}>${label}</label>
            <input
              type="text"
              id=${id}
              .value=${string}
              onchange=${(/** @type {InputEventWithTarget} */ event) => {
                if (!event.target.value) {
                  strings.splice(index, 1);
                } else {
                  strings[index] = event.target.value;
                }
                (!info.validate || info.validate(event)) && hook(name, strings);
              }}
            />
          `;
        })}<button
          onclick=${() => {
            strings.push("New");
            hook(name, strings);
          }}
        >
          ${info.addMessage}
        </button>`;
    }

    default:
      console.log("tbd", name);
      return html`<p>${name}</p>`;
  }
}
