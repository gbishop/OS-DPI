import { html } from "../_snowpack/pkg/uhtml.js";
import { validateColor, getColor } from "./style.js";
import { textInput } from "./input.js";
import { log } from "../log.js";
import css from "../_snowpack/pkg/ustyler.js";

/**
 * @param {Tree} component
 * @param {string} name
 * @param {any} value
 * @param {PropertyInfo} info
 * @param {Context} context
 * @param {(name: string, value: any) => void} hook
 */
export function propEditor(component, name, value, info, context, hook) {
  function propUpdate({ target }) {
    const name = target.name;
    const value = target.value;
    log({ name, value });
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
          help=${info.name}
          onchange=${propUpdate}
          autocomplete="off"
          ?disabled=${info.disabled && info.disabled(component.props)}
        />`;

    case "number":
      return html`${label}
        <input
          type="number"
          id=${name}
          name=${name}
          .value=${value}
          step=${info.step || 1}
          help=${info.name}
          onchange=${propUpdate}
          autocomplete="off"
          ?disabled=${info.disabled && info.disabled(component.props)}
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
            help=${info.name}
            onchange=${(/** @type {InputEventWithTarget} */ event) =>
              validateColor(event) && propUpdate(event)}
            autocomplete="off"
            ?disabled=${info.disabled && info.disabled(component.props)}
          />
          <div
            class="swatch"
            style=${`background-color: ${getColor(value)}`}
          ></div>
        </div>`;

    case "select":
      return html`<label for=${name}>${info.name}</label>
        <select
          id=${name}
          name=${name}
          onchange=${propUpdate}
          help=${info.name}
          ?disabled=${info.disabled && info.disabled(component.props)}
        >
          ${(info.values &&
            Object.keys(info.values).map(
              (opt) =>
                html`<option value=${opt} ?selected=${opt == value}>
                  ${info.values[opt]}
                </option>`
            )) ||
          html``}
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
        help: info.name,
        validate: (value) => (value.match(/^\$\w+$/) ? "" : "Invalid state"),
        update: hook,
        suggestions: states,
      });

    case "tags": {
      if (!component.designer.tags) {
        component.designer.tags = [...value];
      }
      /** @type {string[]} */
      const tags = component.designer.tags;
      function reflect() {
        const result = tags.filter(validTag);
        hook(name, result);
      }
      /** @param {string} tag */
      function validTag(tag) {
        return tag.match(/^\$?\w+/);
      }
      const { tree, rules } = context;
      let states = new Set([...tree.allStates(), ...rules.allStates()]);
      return html`<fieldset help=${info.name}>
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
              validate: (_) => "",
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

    case "voiceURI":
      return html`<label for=${name}>${info.name}</label>
        <select
          is="select-voice"
          id=${name}
          name=${name}
          help=${name}
          onchange=${propUpdate}
          value=${value}
          ?disabled=${info.disabled && info.disabled(component.props)}
        >
          <option value="">Default</option>
        </select>`;

    default:
      log("tbd", name);
      return html`<p>${name}</p>`;
  }
}

css`
  div.props {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 0.25em 1em;
    border: 1px solid black;
    padding: 1em;
  }

  div.props label {
    grid-column: 1 / 2;
    text-align: right;
  }

  div.props input,
  div.props color-input,
  div.props button {
    grid-column: 2 / 3;
  }

  div.props fieldset {
    grid-column: 1 / 3;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: 0.25em 1em;
    border: 1px solid black;
    padding: 1em;
    padding-block-start: 0;
  }

  div.props fieldset div.suggest {
    grid-column: 2 / 3;
  }

  div.props fieldset button {
    grid-column: 3 / 4;
  }

  input[type="number"] {
    width: 3em;
  }

  select option[disabled] {
    display: none;
  }

  .color-input {
    margin-right: 1em;
    align-items: center;
  }

  .color-input input {
    flex: 1 1 0;
    margin-right: 0.2em;
  }

  .color-input .swatch {
    width: 1em;
    height: 1em;
    display: inline-block;
    border: 1px solid black;
  }
  input:invalid {
    background-color: #fcc;
    border-color: red;
  }

  select#itemPlacement[value="row column from content"] ~ input#rows {
    display: none;
  }
`;
