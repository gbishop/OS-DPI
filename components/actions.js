import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { TabPanel } from "./tabcontrol";
import db from "app/db";
import "css/actions.css";
import Globals from "app/globals";
import { Functions } from "app/eval";

export class Actions extends TabPanel {
  name = new Props.String("Actions");
  scale = new Props.Integer(1);

  allowedChildren = ["Action"];

  /** @type {Action[]} */
  children = [];
  last = {
    /** @type {Action|Null} */
    rule: null,
    /** @type {Object} */
    data: {},
    /** @type {string} */
    event: "",
    /** @type {string} */
    origin: "",
  };

  allowDelete = false;

  init() {
    this.applyRules("init", "init", {});
  }

  /** @typedef {Object} eventQueueItem
   * @property {string} origin
   * @property {string} event
   */

  /** @type {eventQueueItem[]} */
  eventQueue = [];

  /** queue an event from within an event handler
   * @param {String} origin
   * @param {String} event
   */
  queueEvent(origin, event) {
    this.eventQueue.push({ origin, event });
  }

  /**
   * Attempt to apply a rule
   *
   * @param {string} origin - name of the originating element
   * @param {string} event - type of event that occurred, i.e.press
   * @param {Object} data - data associated with the event
   */
  applyRules(origin, event, data) {
    this.last = { origin, event, data, rule: null };
    // first for the event then for any that got queued.
    console.log("applyRules", origin, event, data);
    while (true) {
      const context = { ...Functions, state: Globals.state, ...data };
      for (const rule of this.children) {
        if (origin != rule.props.origin && rule.props.origin != "*") {
          continue;
        }
        const result = rule.conditions.every((restriction) =>
          restriction.Condition.eval(context)
        );
        console.log({ result });
        if (result) {
          this.last.rule = rule;
          const patch = Object.fromEntries(
            rule.updates.map((update) => [
              update.props.stateName,
              update.newValue.eval(context),
            ])
          );
          console.log({ patch });
          Globals.state.update(patch);
          break;
        }
      }
      if (this.eventQueue.length == 0) break;
      const item = this.eventQueue.pop();
      if (item) {
        origin = item.origin;
        event = item.event;
      }
      data = {};
    }
  }

  /**
   * Pass event to rules
   *
   * @param {string} origin - name of the originating element
   * @param {Object} data - data associated with the event
   * @param {string} [event] - optional name for the event
   * @return {(event:Event) => void}
   */
  handler(origin, data, event) {
    return (e) => {
      let ev = event;
      if (e instanceof PointerEvent && e.altKey) {
        ev = "alt-" + event;
      }
      this.applyRules(origin, ev || e.type, data);
    };
  }

  /** @returns {Set<string>} */
  allStates() {
    const result = new Set();
    for (const rule of this.children) {
      for (const condition of rule.conditions) {
        for (const [match] of condition.props.Condition.matchAll(/\$\w+/g)) {
          result.add(match);
        }
      }
      for (const update of rule.updates) {
        result.add(update.props.stateName);
        for (const [match] of update.newValue.value.matchAll(/\$\w+/g)) {
          result.add(match);
        }
      }
    }
    return result;
  }

  template() {
    const { state, actions } = Globals;
    const ruleIndex = state.get("ruleIndex");
    return html`<div class="actions" help="Actions" id=${this.id} tabindex="-1" >
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:13%">Origin</th>
            <th rowspan="2" style="width:25%">Conditions</th>
            <th colspan="2" style="width:50%">Updates</th>
          </tr>
          <tr>
            <th style="width:15%">State</th>
            <th style="width:35%">New value</th>
          </tr>
        </thead>
        ${actions.children.map((action, index) => {
          const updates = action.updates;
          const rs = updates.length;
          const used = action === actions.last.rule;
          /** @param {ActionUpdate} update */
          function showUpdate(update) {
            return html`
              <td>${update.stateName.input()}</td>
              <td class="update">${update.newValue.input()}</td>
            `;
          }
          return html`<tbody ?highlight=${ruleIndex == index}>
            <tr ?used=${used}>
              <td rowspan=${rs}>${action.origin.input()}</td>
              <td class="conditions" rowspan=${rs}>
                <div class="conditions">
                  ${action.conditions.map(
                    (condition) =>
                      html`<div class="condition">
                        ${condition.Condition.input()}
                      </div>`
                  )}
                </div>
              </td>
              ${!rs
                ? html`<td></td>
                    <td></td>`
                : showUpdate(updates[0])}
            </tr>
            ${updates.slice(1).map(
              (update) =>
                html`<tr ?used=${used}>
                  ${showUpdate(update)}
                </tr>`
            )}
          </tbody>`;
        })}
      </table>
    </div>`;
  }

  static async load() {
    let actions = await db.read("actions", {
      className: "Actions",
      props: {},
      children: [],
    });
    // convert from the old format if necessary
    if (Array.isArray(actions)) {
      console.log("converting", actions);
      actions = {
        className: "Actions",
        props: {},
        children: actions.map((action) => {
          let { event, origin, conditions, updates } = action;
          const children = [];
          for (const condition of conditions) {
            children.push({
              className: "ActionCondition",
              props: { Condition: condition },
              children: [],
            });
          }
          for (const [$var, value] of Object.entries(updates)) {
            children.push({
              className: "ActionUpdate",
              props: { stateName: $var, newValue: value },
              children: [],
            });
          }
          return {
            className: "Action",
            props: { event, origin },
            children,
          };
        }),
      };
      console.log("converted", actions);
    }
    const result = /** @type {Actions} */ (this.fromObject(actions));
    return result;
  }

  onUpdate() {
    console.log("update actions", this);
    db.write("actions", this.toObject());
    Globals.state.update();
  }
}
TreeBase.register(Actions, "Actions");

class Action extends TreeBase {
  allowedChildren = ["ActionCondition", "ActionUpdate"];
  /** @type {(ActionCondition | ActionUpdate)[]} */
  children = [];

  origin = new Props.String("", { hiddenLabel: true });
  event = new Props.String("press", { hiddenLabel: true });

  get conditions() {
    return this.filterChildren(ActionCondition);
  }

  get updates() {
    return this.filterChildren(ActionUpdate);
  }
}
TreeBase.register(Action, "Action");

export class ActionCondition extends TreeBase {
  Condition = new Props.Expression("", { hiddenLabel: true });
}
TreeBase.register(ActionCondition, "ActionCondition");

export class ActionUpdate extends TreeBase {
  stateName = new Props.String("", { hiddenLabel: true });
  newValue = new Props.Expression("", { hiddenLabel: true });
}
TreeBase.register(ActionUpdate, "ActionUpdate");
