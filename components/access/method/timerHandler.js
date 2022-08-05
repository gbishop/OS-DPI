import { TreeBase } from "../../treebase";
import { Handler, HandlerCondition } from "./handler";
import { HandlerResponse } from "./responses";
import { Select } from "../../props";
import { html } from "uhtml";
import { Subject } from "rxjs";

const timerSignals = new Map([
  ["transitionend", "Transition end"],
  ["timer", "Timer complete"],
]);

export class TimerHandler extends Handler {
  props = {
    Signal: new Select(timerSignals),
  };

  template() {
    const { conditions, responses } = this;
    const { Signal } = this.props;
    return html`
      <fieldset class="Handler">
        <legend>Timer Handler</legend>
        ${Signal.input()} ${this.deleteButton({ title: "Delete this handler" })}
        <fieldset class="Conditions">
          <legend>
            Conditions
            ${this.addChildButton("+", HandlerCondition, {
              title: "Add a condition",
            })}
          </legend>
          ${this.unorderedChildren(conditions)}
        </fieldset>
        <fieldset class="Responses">
          <legend>
            Responses
            ${this.addChildButton("+", HandlerResponse, {
              title: "Add a response",
            })}
          </legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {Subject} stop$ */
  configure(stop$) {}
}
TreeBase.register(TimerHandler);
