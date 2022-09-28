import { TreeBase } from "../../treebase.js";
import { Handler, HandlerCondition } from "./handler.js";
import { HandlerResponse } from "./responses.js";
import * as Props from "../../props.js";
import { html } from "../../../_snowpack/pkg/uhtml.js";
import * as RxJs from "../../../_snowpack/pkg/rxjs.js";
import { Method } from "./index.js";
import { log } from "../../../log.js";

const timerSignals = new Map([
  ["transitionend", "Transition end"],
  ["animationend", "Animation end"],
  ["timer", "Timer complete"],
]);

export class TimerHandler extends Handler {
  Signal = new Props.Select(timerSignals);
  TimerName = new Props.Select([], { hiddenLabel: true });

  template() {
    const { conditions, responses, Signal } = this;
    const timerNames = this.nearestParent(Method).timerNames;
    return html`
      <fieldset class="Handler">
        <legend>Timer Handler</legend>
        ${Signal.input()} ${this.TimerName.input(timerNames)}
        ${this.deleteButton({ title: "Delete this handler" })}
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

  /** @param {RxJs.Subject} stop$ */
  configure(stop$) {
    log("configure timer");
    const timer = this.nearestParent(Method).timer(this.TimerName.value);
    if (!timer) return;
    const delayTime = 1000 * timer.Interval.valueAsNumber;
    timer.subject$
      .pipe(
        RxJs.switchMap((event) =>
          event.type == "cancel"
            ? RxJs.EMPTY
            : RxJs.of(event).pipe(RxJs.delay(delayTime))
        ),
        RxJs.takeUntil(stop$)
      )
      .subscribe((e) => this.respond(e));
  }
}
TreeBase.register(TimerHandler);
