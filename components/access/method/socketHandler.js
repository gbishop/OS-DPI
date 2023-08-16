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
        if (!this.socket) {
          // the connect wasn't successfully opened, try again
          this.reconfigure();
        }
        if (!this.live) {
          // if the connection was shut down completion then resubscribe to reopen it.
          this.subscribe();
        }
        if (!this.socket || !this.live) return;
        // send the data over the websocket
        this.socket.next(Globals.state.values);
      }
    });
  }

  // true when the socket exists and subscribed
  live = false;

  /** The websocket wrapper object
   * @type {import("rxjs/webSocket").WebSocketSubject<any> | undefined} */
  socket = undefined;

  /** The stream of events from the websocket
   * @type {RxJs.Observable<Event & { access: {}}> | undefined} */
  socket$ = undefined;

  /** Save the stop$ subject so we can use it when reconfiguring
   * @type {RxJs.Subject | undefined} */
  savedStop$ = undefined;

  /** @param {RxJs.Subject} stop$ */
  configure(stop$) {
    this.savedStop$ = stop$;
    this.reconfigure();
  }

  reconfigure() {
    if (!this.savedStop$) return; // keeping type checking happy
    const { conditions } = this;
    // this is the socket object
    this.socket = webSocket(this.URL.value);
    // this is the stream of events from it
    this.socket$ = this.socket.pipe(
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
      RxJs.takeUntil(this.savedStop$)
    );
    this.subscribe();
  }

  subscribe() {
    if (!this.socket$) return;
    this.live = true;
    this.socket$.subscribe({
      next: (e) => {
        /* Incoming data arrives here in the .access property. This code will filter any arrays of objects and
         * include them in the dynamic data
         */
        let dynamicRows = [];
        const fields = [];
        for (const [key, value] of Object.entries(e.access)) {
          console.log(key, value);
          if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object" &&
            value[0] !== null
          ) {
            dynamicRows = dynamicRows.concat(value);
          } else {
            fields.push([key, value]);
          }
        }
        e.access = Object.fromEntries(fields);
        if (dynamicRows.length > 0) {
          Globals.data.setDynamicRows(dynamicRows);
        }
        // pass incoming messages to the response
        this.respond(e);
      },
      error: (err) => {
        // force a call to reconfigure
        console.error("error", err);
        this.live = false;
        this.socket = undefined;
        this.socket$ = undefined;
      },
      complete: () => {
        // mark that it is not live but it could be restarted
        console.log("complete");
        this.live = false;
      },
    });
  }
}
TreeBase.register(SocketHandler, "SocketHandler");
