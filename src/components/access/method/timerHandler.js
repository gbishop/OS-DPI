import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import * as RxJs from "rxjs";
import { Method } from "./index";

const timerSignals = new Map([
  ["transitionend", "Transition end"],
  ["animationend", "Animation end"],
  ["timer", "Timer complete"],
]);

export class TimerHandler extends Handler {
  allowedChildren = ["HandlerCondition", "HandlerResponse"];

  Signal = new Props.Select(timerSignals);
  TimerName = new Props.Select([], { hiddenLabel: true });

  settings() {
    const { conditions, responses, Signal } = this;
    const timerNames = this.nearestParent(Method)?.timerNames;
    return html`
      <fieldset class="Handler" tabindex="0" id=${this.id}>
        <legend>Timer Handler</legend>
        ${Signal.input()} ${this.TimerName.input(timerNames)}
        <fieldset class="Conditions">
          <legend>Conditions</legend>
          ${this.unorderedChildren(conditions)}
        </fieldset>
        <fieldset class="Responses">
          <legend>Responses</legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {RxJs.Subject} _stop$ */
  configure(_stop$) {
    const method = this.method;
    const timerName = this.TimerName.value;
    // there could be multiple timers active at once
    const streamName = `timer-${timerName}`;
    // only create it once
    if (method.streams[streamName]) return;

    const timer = method.timer(timerName);
    if (!timer) return;

    const delayTime = 1000 * timer.Interval.valueAsNumber;
    method.streams[streamName] = timer.subject$.pipe(
      RxJs.switchMap((event) =>
        event.type == "cancel"
          ? RxJs.EMPTY
          : RxJs.of(event).pipe(RxJs.delay(delayTime)),
      ),
    );
  }
}
TreeBase.register(TimerHandler, "TimerHandler");
