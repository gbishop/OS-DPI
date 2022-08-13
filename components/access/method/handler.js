import { html } from "uhtml";
import css from "ustyler";
import { TreeBase } from "../../treebase";
import { HandlerResponse } from "./responses";
import { Select, Expression } from "../../props";
import { Subject } from "rxjs";
import { Method } from "./index";
import { EventWrap } from "../index";

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
      <div class="Condition">${this.select()} ${Condition.input()}</div>
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
    return html` <div class="Key">${this.select()} ${Key.input()}</div> `;
  }
}
TreeBase.register(HandlerKeyCondition);

css`
  ul {
    list-style: none;
    padding-inline-start: 0;
  }
`;
