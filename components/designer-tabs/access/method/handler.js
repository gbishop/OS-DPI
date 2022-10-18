import { html } from "uhtml";
import { TreeBase } from "../../../treebase";
import { HandlerResponse } from "./responses";
import * as Props from "../../../props";
import * as RxJs from "rxjs";
import { Method } from "./index";

/** Handler is a base class for all event handlers */
export class Handler extends TreeBase {
  /** @type {(HandlerCondition | HandlerKeyCondition | HandlerResponse)[]} */
  children = [];

  get conditions() {
    return this.filterChildren(HandlerCondition);
  }

  get keys() {
    return this.filterChildren(HandlerKeyCondition);
  }

  get responses() {
    return this.filterChildren(HandlerResponse);
  }

  /**
   * @param {RxJs.Subject} _stop$
   * */
  configure(_stop$) {
    throw new TypeError("Must override configure");
  }

  /** @param {WrappedEvent} event */
  respond(event) {
    // console.log("handler respond", event.type, this.responses);
    const method = this.nearestParent(Method);
    method.cancelTimers();
    for (const response of this.responses) {
      response.respond(event);
    }
  }
}

export class HandlerCondition extends TreeBase {
  Condition = new Props.Expression("", { hiddenLabel: true });

  settings() {
    const { Condition } = this;
    return html`
      <div class="Condition">
        ${Condition.input()}
        ${this.deleteButton({ title: "Delete this condition" })}
      </div>
    `;
  }

  /** @param {Object} context */
  eval(context) {
    return this.Condition.eval(context);
  }
}
TreeBase.register(HandlerCondition);

const allKeys = new Map([
  [" ", "Space"],
  ["Enter", "Enter"],
  ["ArrowLeft", "Left Arrow"],
  ["ArrowRight", "Right Arrow"],
  ["ArrowUp", "Up Arrow"],
  ["ArrowDown", "Down Arrow"],
]);

export class HandlerKeyCondition extends TreeBase {
  Key = new Props.Select(allKeys, { hiddenLabel: true });

  settings() {
    const { Key } = this;
    return html`
      <div class="Key">
        ${Key.input()} ${this.deleteButton({ title: "Delete this key" })}
      </div>
    `;
  }
}
TreeBase.register(HandlerKeyCondition);
