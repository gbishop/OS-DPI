import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import * as RxJs from "rxjs";
import { webSocket } from "rxjs/webSocket";
import { EventWrap } from "..";
import Globals from "app/globals";

export class SocketHandler extends Handler {
  allowedChildren = ["HandlerCondition", "HandlerResponse"];

  StateName = new Props.String("$socket");
  URL = new Props.String("ws://localhost:5678/");

  settings() {
    const { conditions, responses, StateName, URL } = this;
    return html`
      <fieldset class="Handler">
        <legend>Socket Handler</legend>
        ${StateName.input()} ${URL.input()}
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

  init() {
    // arrange to watch for state changes
    // TODO: figure out how to remove these or make them weak
    Globals.state.observe(() => {
      if (Globals.state.hasBeenUpdated(this.StateName.value)) {
        if (this.socket) {
          // send the entire state over to the server
          this.socket.next(Globals.state.values);
        }
      }
    });
  }

  /** @type {import("rxjs/webSocket").WebSocketSubject<any>} */
  socket;

  /** @param {RxJs.Subject} stop$ */
  configure(stop$) {
    const { conditions } = this;
    this.socket = webSocket(this.URL.value);
    this.socket
      .pipe(
        RxJs.map((msg) => {
          const event = new Event("socket");
          const wrapped = EventWrap(event);
          wrapped.access = msg;
          return wrapped;
        }),
        RxJs.filter(
          (e) =>
            conditions.length == 0 ||
            conditions.every((condition) => condition.Condition.eval(e.access))
        ),
        RxJs.takeUntil(stop$)
      )
      .subscribe({
        next: (e) => {
          this.respond(e);
        },
        error(err) {
          console.error(err);
        },
        complete() {
          console.log("complete");
        },
      });
  }
}
TreeBase.register(SocketHandler, "SocketHandler");
