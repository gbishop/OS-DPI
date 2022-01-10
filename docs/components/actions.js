import { log } from "../log.js";
import { html } from "../snowpack/pkg/uhtml.js";
import { Base } from "./base.js";
import { textInput } from "./input.js";
import db from "../db.js";
import css from "../snowpack/pkg/ustyler.js";

export class Actions extends Base {
  /**
   * @param {SomeProps} props
   * @param {Context} context
   * @param {Base|Null} parent
   */
  constructor(props, context, parent) {
    super(props, context, parent);
    /** @type {ActionEditor} */
    this.ruleEditor = new ActionEditor({}, this.context, this);
  }

  template() {
    const { state, rules } = this.context;
    const ruleIndex = state.get("ruleIndex");
    return html`<div class="actions">
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th rowspan="2">Origin</th>
              <th rowspan="2">Event</th>
              <th rowspan="2">Conditions</th>
              <th colspan="2">Updates</th>
            </tr>
            <tr>
              <th>State</th>
              <th>New value</th>
            </tr>
          </thead>
          ${rules.map((rule, index) => {
            const updates = Object.entries(rule.updates);
            const rs = updates.length;
            const used = rule === rules.last.rule;
            return html`<tbody ?highlight=${ruleIndex == index}>
              <tr ?used=${used}>
                <td rowspan=${rs}>${rule.origin}</td>
                <td rowspan=${rs}>${rule.event}</td>
                <td class="conditions" rowspan=${rs}>
                  ${this.showConditions(rule.conditions)}
                </td>
                <td>${(updates.length && updates[0][0]) || ""}</td>
                <td class="update">
                  ${(updates.length && updates[0][1]) || ""}
                </td>
                <td rowspan=${rs}>
                  <button onclick=${() => this.openActionEditor(index)}>
                    &#x270D;
                  </button>
                </td>
              </tr>
              ${updates.slice(1).map(
                ([key, value]) =>
                  html`<tr ?used=${used}>
                  <td>${key}</td>
                  <td class="update">${value}</td>
                </tr></tbody>`
              )}
            </tbody>`;
          })}
          <tr>
            <td colspan="6">
              <button
                onclick=${() => {
                  rules.rules.push({
                    origin: "",
                    event: "",
                    conditions: [],
                    updates: {},
                  });
                  this.openActionEditor(rules.rules.length - 1);
                }}
              >
                Add an action
              </button>
            </td>
          </tr>
          <tr></tr>
        </table>
      </div>
      ${this.ruleEditor.template()}
    </div>`;
  }

  /** @param {number} index */
  openActionEditor(index) {
    const { state, rules } = this.context;
    if (isNaN(index) || index < 0 || index >= rules.rules.length) {
      this.ruleEditor.close();
    } else {
      this.ruleEditor.open(index);
    }
    state.update({ ruleIndex: index });
  }

  /** @param {string[]} conditions */
  showConditions(conditions) {
    return html`<div class="conditions">
      ${conditions.map(
        (condition) => html`<div class="condition">${condition}</div>`
      )}
    </div>`;
  }

  /** @param {Object<string,string>} updates */
  showUpdates(updates) {
    return html`<div class="updates">
      ${Object.entries(updates).map(
        ([key, value]) =>
          html`
            <span class="key">${key}</span>
            <span class="value">${value}</span>
          `
      )}
    </div>`;
  }
}

/** @class ActionEditor
 * @property {Rule} rule
 * @property {string} origin
 * @property {string} event
 * @property {string[]} conditions
 * @property {Object} updates
 */
class ActionEditor extends Base {
  /**
   * @param {SomeProps} props
   * @param {Context} context
   * @param {Base|Null} parent
   */
  constructor(props, context, parent = null) {
    super(props, context, parent);
    this.ruleIndex = -1;
    // fool the checker
    this.rule = context.rules.rules[0];
  }

  /** @param {number} index */
  open(index) {
    const { rules } = this.context;
    this.ruleIndex = index;
    this.rule = rules.rules[this.ruleIndex];
    log(this.ruleIndex, this.rule);
    this.origin = this.rule.origin;
    this.event = this.rule.event;
    this.conditions = [...this.rule.conditions];
    this.updates = Object.entries(this.rule.updates);
    log("open", this);
  }

  close() {
    this.ruleIndex = -1;
    this.context.state.update({ ruleIndex: -1 });
  }

  template() {
    const { state, rules, tree } = this.context;

    if (this.ruleIndex < 0 || !this.rule) return html``;

    return html`<div class="editor">
      ${textInput({
        type: "text",
        name: "origin",
        label: "Origin",
        value: this.rule.origin,
        context: this.context,
        validate: (value) => (value.match(/^\w+$/) ? "" : "Invalid origin"),
        update: (name, value) => (this.rule[name] = value),
        suggestions: tree.all(/\w+/g, ["name"]),
      })}
      ${textInput({
        type: "text",
        name: "event",
        label: "Event",
        value: this.rule.event,
        context: this.context,
        validate: (value) =>
          ["press"].indexOf(value) >= 0 ? "" : "Invalid event",
        update: (name, value) => (this.rule[name] = value),
        suggestions: new Set(["press"]),
      })}
      ${this.editConditions()} ${this.editUpdates()}
      <div>
        <button onclick=${() => this.close()}>Return</button>
        <button
          ?disabled=${this.ruleIndex < 1}
          onclick=${() => {
            const R = rules.rules;
            [R[this.ruleIndex - 1], R[this.ruleIndex]] = [
              R[this.ruleIndex],
              R[this.ruleIndex - 1],
            ];
            this.ruleIndex -= 1;
            state.update({ ruleIndex: this.ruleIndex });
          }}
        >
          Move earlier
        </button>
        <button
          ?disabled=${this.ruleIndex < 0 ||
          this.ruleIndex >= rules.rules.length - 1}
          onclick=${() => {
            const R = rules.rules;
            [R[this.ruleIndex + 1], R[this.ruleIndex]] = [
              R[this.ruleIndex],
              R[this.ruleIndex + 1],
            ];
            this.ruleIndex += 1;
            state.update({ ruleIndex: this.ruleIndex });
          }}
        >
          Move later
        </button>
        <button
          ?disabled=${this.ruleIndex < 0}
          onclick=${() => {
            const R = rules.rules;
            R.splice(this.ruleIndex, 1);
            this.close();
          }}
        >
          Delete
        </button>
      </div>
    </div> `;
  }

  editConditions() {
    const conditions = this.conditions;
    const context = this.context;
    const allStates = context.tree.allStates();
    const allFields = context.data.allFields;
    const suggestions = new Set([...allStates, ...allFields]);

    const reflect = () => {
      this.rule.conditions = this.conditions.filter(
        (condition) => condition.length > 0
      );
      context.state.update();
    };
    return html`<fieldset>
      <legend>Conditions</legend>
      ${conditions.map((string, index) => {
        const id = `conditions_${index}`;
        const label = `${index + 1}`;
        return html`${textInput({
            type: "text",
            name: id,
            label,
            value: string,
            context,
            validate: (value) =>
              value.length == 0 || context.rules.validateExpression(value)
                ? ""
                : "Invalid condition",
            update: (_, value) => {
              if (!value) {
                conditions.splice(index, 1);
              } else {
                conditions[index] = value;
              }
              reflect();
            },
            suggestions,
          })}<button
            onclick=${() => {
              conditions.splice(index, 1);
              reflect();
            }}
          >
            X
          </button>`;
      })}
      <button
        style="grid-column: 2 / 4"
        onclick=${() => {
          conditions.push("");
          reflect();
        }}
      >
        Add condition
      </button>
    </fieldset>`;
  }

  editUpdates() {
    const { state, rules, data, tree } = this.context;
    const updates = this.updates;

    const reflect = () => {
      // these should be filtered to remove bad ones
      this.rule.updates = Object.fromEntries(
        this.updates.filter(
          ([key, value]) => key.length > 0 && value.length > 0
        )
      );
      state.update();
      this.save();
    };
    const allStates = new Set([...tree.allStates(), ...rules.allStates()]);
    const allFields = new Set(data.allFields);
    const both = new Set([...allStates, ...allFields]);
    // value updates
    return html`<fieldset>
      <legend>Updates</legend>
      ${updates.length > 0
        ? html` <span class="key">State</span>
            <span class="value">New value</span>`
        : ""}
      ${updates.map(([key, value], index) => {
        const idv = `value_${index + 1}`;
        const idk = `key_${index + 1}`;
        const keyInput = textInput({
          type: "text",
          className: "key",
          name: idk,
          label: `${index + 1}`,
          value: key,
          context: this.context,
          suggestions: allStates,
          validate: (value) => (value.match(/^\$\w+$/) ? "" : "Invalid state"),
          update: (_, value) => {
            updates[index][0] = value;
            reflect();
          },
        });
        const valueInput = textInput({
          type: "text",
          className: "value",
          name: idv,
          label: `${index} value`,
          labelHidden: true,
          value,
          context: this.context,
          suggestions: both,
          validate: (value) =>
            value.length == 0 || rules.validateExpression(value)
              ? ""
              : "Invalid value",
          update: (_, value) => {
            updates[index][1] = value;
            reflect();
          },
        });
        return html`${keyInput} ${valueInput}
          <button
            onclick=${() => {
              updates.splice(index, 1);
              reflect();
            }}
          >
            X
          </button>`;
      })}
      <button
        style="grid-column: 1/4"
        onclick=${() => {
          updates.push(["", ""]);
          reflect();
        }}
      >
        Add update
      </button>
    </fieldset>`;
  }

  /** Save the actions */
  save() {
    const { rules } = this.context;
    db.write("actions", rules.rules);
  }
}

css`
  div.actions {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    overflow: hidden;
  }

  div.actions div.scroll {
    overflow-y: auto;
  }

  .actions table {
    border-collapse: collapse;
    width: 100%;
  }

  .actions tr[used] {
    font-weight: bold;
  }

  .actions td,
  .actions th {
    border: 1px solid #999;
    padding: 0.5em;
  }

  .actions td.conditions {
    overflow-wrap: anywhere;
  }

  .actions td.update {
    overflow-wrap: anywhere;
  }

  .actions thead tr {
    background: white;
  }

  .actions tbody {
    border: 2px solid black;
    position: relative;
    z-index: 10;
  }
  .actions thead {
    border: 2px solid black;
    z-index: 15;
  }

  .actions tbody[highlight] {
    outline: 2px solid red;
    z-index: 100;
  }

  .actions tbody:nth-child(even):after {
    content: "";
    background-color: rgb(0, 0, 0, 0.1);
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
  }

  .actions .updates {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 0.25em 1em;
  }

  .actions div.editor {
    display: grid;
    grid-template-columns: auto 1fr 2fr;
    grid-gap: 0.25em 1em;
    border: 1px solid black;
    padding: 1em;
  }

  .actions div.editor label {
    grid-column: 1 / 2;
    text-align: right;
  }

  .actions div.editor div.suggest {
    grid-column: 2 / 4;
  }

  .actions div.editor div.suggest.key {
    grid-column: 2 / 3;
  }

  .actions div.editor label.key {
    grid-column: 1 / 2;
  }

  .actions div.editor div.suggest.value {
    grid-column: 3 / 4;
  }

  .actions div.editor span.key {
    grid-column: 2 / 3;
  }

  .actions div.editor span.key,
  .actions div.editor span.value {
    font-weight: bold;
  }

  .actions div.editor div {
    grid-column: 1 / 4;
  }

  .actions div.editor fieldset {
    grid-column: 1 / 4;
    display: grid;
    grid-template-columns: auto 1fr 2fr auto;
    grid-gap: 0.25em 1em;
    border: 1px solid black;
    padding: 1em;
    padding-block-start: 0;
  }
`;
