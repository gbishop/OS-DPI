import { html } from "uhtml";
import { Base } from "./base";
import { propEditor, suggest } from "./propEditor";
import * as focusTrap from "focus-trap";

export class Actions extends Base {
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
            return html`<tbody ?highlight=${ruleIndex == index}>
              <tr>
                <td rowspan=${rs}>${rule.origin}</td>
                <td rowspan=${rs}>${rule.event}</td>
                <td rowspan=${rs}>${this.showConditions(rule.conditions)}</td>
                <td>${(updates.length && updates[0][0]) || ""}</td>
                <td>${(updates.length && updates[0][1]) || ""}</td>
                <td rowspan=${rs}>
                  <button onclick=${() => state.update({ ruleIndex: index })}>
                    &#x270D;
                  </button>
                </td>
              </tr>
              ${updates.slice(1).map(
                ([key, value]) =>
                  html`<tr>
                  <td>${key}</td>
                  <td>${value}</td>
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
                  state.update({ ruleIndex: rules.rules.length - 1 });
                }}
              >
                Add an action
              </button>
            </td>
          </tr>
          <tr></tr>
        </table>
      </div>
      ${this.ruleEditor()}
    </div>`;
  }

  ruleEditor() {
    const { state, rules, tree, data } = this.context;
    const ruleIndex = state.get("ruleIndex");
    if (isNaN(ruleIndex) || ruleIndex < 0) {
      return html``;
    }
    console.log("re", rules, ruleIndex, rules[ruleIndex]);
    const rule = rules.rules[ruleIndex];
    /** @param {string} name
     * @param {string} value
     */
    function update(name, value) {
      rule[name] = value.trim();
      state.update();
    }
    return html`<div
      class="editor"
      ref=${(/** @type {HTMLElement} */ div) => {
        this.trap = focusTrap.createFocusTrap(div, {
          allowOutsideClick: true,
          onDeactivate: () => {
            console.log("deactivate trap");
            this.context.state.update({ ruleIndex: -1 });
          },
          onActivate: () => {
            console.log("activate trap");
          },
        });
        this.trap.activate();
      }}
    >
      ${propEditor(
        "origin",
        rule.origin,
        {
          type: "string",
          name: "Origin",
          description: "Name of the control where the event originated.",
        },
        update
      )}
      ${propEditor(
        "event",
        rule.event,
        {
          type: "string",
          name: "Event",
          description: "The event that occurred.",
        },
        update
      )}
      ${this.editConditions(rule)} ${this.editUpdates(rule)}
      <div>
        <button onclick=${() => this.trap.deactivate()}>Return</button>
        <button
          ?disabled=${ruleIndex < 1}
          onclick=${() => {
            const R = rules.rules;
            [R[ruleIndex - 1], R[ruleIndex]] = [R[ruleIndex], R[ruleIndex - 1]];
            state.update({ ruleIndex: ruleIndex - 1 });
          }}
        >
          Move earlier
        </button>
        <button
          ?disabled=${ruleIndex < 0 || ruleIndex > rules.rules.length - 1}
          onclick=${() => {
            const R = rules.rules;
            [R[ruleIndex + 1], R[ruleIndex]] = [R[ruleIndex], R[ruleIndex + 1]];
            state.update({ ruleIndex: ruleIndex + 1 });
          }}
        >
          Move later
        </button>
        <button
          ?disabled=${ruleIndex < 0}
          onclick=${() => {
            const R = rules.rules;
            R.splice(ruleIndex, 1);
            state.update({ ruleIndex: Math.min(R.length - 1, ruleIndex) });
          }}
        >
          Delete
        </button>
      </div>
    </div> `;
  }

  /** @param {Rule} rule
   */
  editConditions(rule) {
    const strings = [...rule.conditions, ""];
    return html`<fieldset>
      <legend>Conditions</legend>
      ${strings.map((string, index) => {
        const id = `conditions_${index}`;
        const label = `conditions ${index + 1}`;
        return html`
          <label for=${id} hidden>${label}</label>
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
              rule.conditions = strings;
              this.context.state.update();
            }}
          />
        `;
      })}
    </fieldset>`;
  }

  /** @param {Rule} rule */
  editUpdates(rule) {
    const object = rule.updates ? { ...rule.updates } : {};
    const entries = Object.entries(object);
    let stateNode = null;
    let valueNode = null;
    const { state, rules, data, tree } = this.context;
    const allStates = [...tree.allStates(), ...rules.allStates(), "$Speak"];
    const allFields = data.allFields;
    const both = [...allStates, ...allFields];
    // value updates
    return html` <fieldset>
      <legend>Update</legend>
      <span class="key">State</span>
      <span class="value">New value</span>
      ${entries.map(([key, value]) => {
        const idv = `updates_${key}_value`;
        return html`<label class="key" for=${idv}>${key}</label>
          <input
            class="value"
            type="text"
            id=${idv}
            .value=${value}
            onchange=${(/** @type {InputEventWithTarget} */ event) => {
              const newValue = event.target.value.trim();
              if (!newValue) {
                delete object[key];
              } else {
                object[key] = newValue;
              }
              rule.updates = object;
              this.context.state.update();
            }}
            ref=${(node) => {
              suggest(node, both);
            }}
            autocomplete="off"
          /> `;
      })}
      <label for="newState" hidden>new State</label>
      <input
        class="key"
        type="text"
        id="newState"
        .value=${""}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          const newKey = event.target.value.trim();
          const newValue = valueNode && valueNode.value.trim();
          if (newKey && newValue) {
            object[newKey] = newValue;
            rule.updates = object;
            state.update();
          }
        }}
        oninput=${(/** @type {InputEventWithTarget} */ ev) => {
          const target = ev.target;
          if (!target.value.startsWith("$")) {
            target.setCustomValidity("states must begin with $");
          }
        }}
        ref=${(node) => {
          stateNode = node;
          suggest(node, allStates);
        }}
        autocomplete="off"
      />
      <label for="newValue" hidden>new value</label>
      <input
        class="value"
        type="text"
        id="newValue"
        .value=${""}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          const newValue = event.target.value.trim();
          const newKey = stateNode && stateNode.value.trim();
          console.log({ newKey, newValue, snv: stateNode.value });
          if (!newValue && newKey) {
            delete object[newKey];
            rule.updates = object;
            state.update();
          } else if (newValue && newKey) {
            object[newKey] = newValue;
            rule.updates = object;
            state.update();
          }
        }}
        ref=${(node) => {
          valueNode = node;
          suggest(node, both);
        }}
        autocomplete="off"
      />
    </fieldset>`;
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
