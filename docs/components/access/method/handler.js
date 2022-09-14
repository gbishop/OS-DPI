import { html } from "uhtml";
import { TreeBase } from "../../treebase.js";
import { HandlerResponse } from "./responses.js";
import { Select, Expression } from "../../props.js";
import { Subject } from "rxjs";
import { Method } from "./index.js";
import { EventWrap } from "../index.js";

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

  /** @param {Subject} _stop$ */
  configure(_stop$) {
    throw new TypeError("Must override configure");
  }

  /** @param {WrappedEvent} event */
  respond(event) {
    const method = this.nearestParent(Method);
    method.cancelTimers();
    for (const response of this.responses) {
      response.respond(event);
    }
  }
}

export class HandlerCondition extends TreeBase {
  Condition = new Expression("", { hiddenLabel: true });

  template() {
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
  Key = new Select(allKeys, { hiddenLabel: true });

  template() {
    const { Key } = this;
    return html`
      <div class="Key">
        ${Key.input()} ${this.deleteButton({ title: "Delete this key" })}
      </div>
    `;
  }
}
TreeBase.register(HandlerKeyCondition);
