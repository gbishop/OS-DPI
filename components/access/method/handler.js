import { html } from "uhtml";
import { TreeBase } from "../../treebase";
import { HandlerResponse } from "./responses";
import { Select, Expression } from "../../props";
import { Subject } from "rxjs";
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
    for (const response of this.responses) {
      response.respond(event);
    }
  }
}

export class HandlerCondition extends TreeBase {
  props = {
    Condition: new Expression("", { hiddenLabel: true }),
  };

  template() {
    const { Condition } = this.props;
    return html`
      <div class="Condition">
        ${Condition.input()}
        ${this.deleteButton({ title: "Delete this condition" })}
      </div>
    `;
  }

  /** @param {Object} context */
  eval(context) {
    return this.props.Condition.eval(context);
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
  props = {
    Key: new Select(allKeys, { hiddenLabel: true }),
  };

  template() {
    const { Key } = this.props;
    return html`
      <div class="Key">
        ${Key.input()} ${this.deleteButton({ title: "Delete this key" })}
      </div>
    `;
  }
}
TreeBase.register(HandlerKeyCondition);
