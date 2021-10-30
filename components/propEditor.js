import { html } from "uhtml";
import { validateColor, getColor } from "./style";
import { textInput } from "./input";

/**
 * @param {Tree} component
 * @param {string} name
 * @param {any} value
 * @param {PropertyInfo} info
 * @param {Context} context
 * @param {(name: string, value: any) => void} [hook]
 */
export function propEditor(component, name, value, info, context, hook) {
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
      if (!component?.designer.tags) {
        component.designer.tags = [...value];
      }
      const tags = component.designer.tags;
      function reflect() {
        const result = tags.filter(validTag);
        hook(name, result);
      }
      function validTag(tag) {
        return tag.match(/^\$?\w+/);
      }
      const { tree, rules } = context;
      let states = new Set([...tree.allStates(), ...rules.allStates()]);
      return html`<fieldset>
        <legend>Tags</legend>
        ${tags.map((tag, index) => {
          const id = `tags_${index}`;
          const label = `${index + 1}`;
          return html`${textInput({
              type: "text",
              name: id,
              label,
              value: tag,
              context,
              validate: (value) => "",
              update: (_, value) => {
                if (!value) {
                  tags.splice(index, 1);
                } else {
                  tags[index] = value;
                }
                reflect();
              },
              suggestions: states,
            })}<button
              onclick=${() => {
                tags.splice(index, 1);
                reflect();
              }}
            >
              X
            </button>`;
        })}
        <button
          style="grid-column: 2 / 3"
          onclick=${() => {
            tags.push("");
            reflect();
          }}
        >
          Add tag
        </button>
      </fieldset> `;
    }

    default:
      console.log("tbd", name);
      return html`<p>${name}</p>`;
  }
}
