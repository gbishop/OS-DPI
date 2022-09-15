import { log } from "../log";
import { html } from "uhtml";
import { Base } from "./base";
import { textInput } from "./input";
import { validateExpression } from "../eval";
import db from "../db";
import css from "ustyler";
import Globals from "../globals";

export class Actions extends Base {
  /**
   * @param {SomeProps} props
   * @param {Base|Null} parent
   */
  constructor(props, parent) {
    super(props, parent);
    /** @type {ActionEditor} */
    this.ruleEditor = new ActionEditor({}, this);
  }

  template() {
    const { state, rules } = Globals;
    const ruleIndex = state.get("ruleIndex");
    return html`<div class="actions" help="Actions">
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
                  <button
                    onclick=${() => this.openActionEditor(index)}
                    title="Edit action"
                  >
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
                help="Actions#add-an-action"
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
    const { state, rules } = Globals;
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
   * @param {Base|Null} parent
   */
  constructor(props, parent = null) {
    super(props, parent);
    this.ruleIndex = -1;
    // fool the checker
    this.rule = Globals.rules.rules[0];
  }

  /** @param {number} index */
  open(index) {
    const { rules } = Globals;
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
    Globals.state.update({ ruleIndex: -1 });
  }

  template() {
    const { state, rules, tree } = Globals;

    if (this.ruleIndex < 0 || !this.rule) return html``;

    return html`<div class="editor">
      ${textInput({
        type: "text",
        name: "origin",
        label: "Origin",
        value: this.rule.origin,
        help: "Actions#origin",
        validate: (value) => (value.match(/^\w+$|\*/) ? "" : "Invalid origin"),
        update: (name, value) => {
          this.rule[name] = value;
          this.save();
        },
        suggestions: tree.all(/\w+/g, ["name"]),
      })}
      ${textInput({
        type: "text",
        name: "event",
        label: "Event",
        value: this.rule.event,
        help: "Actions#event",
        validate: (value) =>
          ["press", "init"].indexOf(value) >= 0 ? "" : "Invalid event",
        update: (name, value) => {
          this.rule[name] = value;
          this.save();
        },
        suggestions: new Set(["press"]),
      })}
      ${this.editConditions()} ${this.editUpdates()}
      <div>
        <button onclick=${() => this.close()} help="Actions#return">
          Return
        </button>
        <button
          ?disabled=${this.ruleIndex < 1}
          help="Actions#move-action-earlier"
          onclick=${() => {
            const R = rules.rules;
            [R[this.ruleIndex - 1], R[this.ruleIndex]] = [
              R[this.ruleIndex],
              R[this.ruleIndex - 1],
            ];
            this.ruleIndex -= 1;
            state.update({ ruleIndex: this.ruleIndex });
            this.save();
          }}
        >
          Move earlier
        </button>
        <button
          ?disabled=${this.ruleIndex < 0 ||
          this.ruleIndex >= rules.rules.length - 1}
          help="Actions#move-action-later"
          onclick=${() => {
            const R = rules.rules;
            [R[this.ruleIndex + 1], R[this.ruleIndex]] = [
              R[this.ruleIndex],
              R[this.ruleIndex + 1],
            ];
            this.ruleIndex += 1;
            state.update({ ruleIndex: this.ruleIndex });
            this.save();
          }}
        >
          Move later
        </button>
        <button
          ?disabled=${this.ruleIndex < 0}
          help="Actions#delete-action"
          onclick=${async () => {
            const R = rules.rules;
            R.splice(this.ruleIndex, 1);
            await this.save();
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
    const allStates = Globals.tree.allStates();
    const allFields = Globals.data.allFields;
    const suggestions = new Set([...allStates, ...allFields]);

    const reflect = () => {
      this.rule.conditions = this.conditions.filter(
        (condition) => condition.length > 0
      );
      Globals.state.update();
      this.save();
    };
    return html`<fieldset help="Actions#conditions">
      <legend>Conditions</legend>
      ${conditions.map((string, index) => {
        const id = `conditions_${index}`;
        const label = `${index + 1}`;
        return html`${textInput({
            type: "text",
            name: id,
            label,
            value: string,
            validate: (value) =>
              value.length == 0 || validateExpression(value)
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
            title="Delete condition"
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
    const { state, rules, data, tree } = Globals;
    const updates = this.updates;

    const reflect = async () => {
      // these should be filtered to remove bad ones
      this.rule.updates = Object.fromEntries(
        this.updates.filter(
          ([key, value]) => key.length > 0 && value.length > 0
        )
      );
      state.update();
      await this.save();
    };
    const allStates = new Set([...tree.allStates(), ...rules.allStates()]);
    const allFields = new Set(data.allFields);
    const both = new Set([...allStates, ...allFields]);
    // value updates
    return html`<fieldset help="Actions#updates">
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
          suggestions: both,
          validate: (value) =>
            value.length == 0 || validateExpression(value)
              ? ""
              : "Invalid value",
          update: (_, value) => {
            updates[index][1] = value;
            reflect();
          },
        });
        return html`${keyInput} ${valueInput}
          <button
            title="Delete action update"
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
  async save() {
    const { rules } = Globals;
    await db.write("actions", rules.rules);
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
