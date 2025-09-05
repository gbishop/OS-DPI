import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import * as RxJs from "rxjs";
import { webSocket } from "rxjs/webSocket";
import { timer } from "rxjs";
import { retryWhen, repeatWhen, tap as opTap, delayWhen } from "rxjs/operators";
import Globals from "app/globals";
import { GridFilter } from "components/gridFilter";

export class SocketHandler extends Handler {
  allowedChildren = ["HandlerCondition", "HandlerResponse", "GridFilter"];

  StateName = new Props.String("$socket");
  URL = new Props.String("ws://localhost:5678/");

  get filters() {
    return this.filterChildren(GridFilter);
  }

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
        ${GridFilter.FilterSettings(this.filters)}
      </fieldset>
    `;
  }

  init() {
    super.init();
    // set the signal value
    this.Signal.set("socket");

    // watch for state changes to send data
    Globals.state.observe(() => {
      if (Globals.state.hasBeenUpdated(this.StateName.value)) {
        if (!this.socket) {
          console.error("socket is not active");
          return;
        }
        this.sendData();
      }
    });
  }

  /** @type {import("rxjs/webSocket").WebSocketSubject<any> | undefined} */
  socket = undefined;

  /** @type {RxJs.Observable<EventLike> | undefined} */
  socket$ = undefined;

  /** @type {RxJs.Subscription | undefined} */
  socketSub = undefined;

  configure() {
    const method = this.method;
    const streamName = "socket";
    // only initialize once
    if (method.streams[streamName]) return;

    // create the WebSocketSubject with observers
    this.socket = webSocket({
      url: this.URL.value,
      openObserver: {
        next: () => console.log("✅ WS opened to", this.URL.value)
      },
      closeObserver: {
        next: (e) => console.log("⚠️ WS closed", e)
      }
    });

    // wrap incoming messages into EventLike with auto-reconnect
    this.socket$ = this.socket.pipe(
      retryWhen(errors =>
        errors.pipe(
          opTap(err => console.warn("⚠️ WS error, retrying in 5s", err)),
          delayWhen(() => timer(5000))
        )
      ),
      repeatWhen(closes =>
        closes.pipe(
          opTap(() => console.warn("⚠️ WS closed, retrying in 5s")),
          delayWhen(() => timer(5000))
        )
      ),
      RxJs.map((msg) => {
        const event = new Event("socket");
        /** @type {EventLike} */
        const wrapped = {
          type: "socket",
          timeStamp: event.timeStamp,
          access: msg,
          target: null,
        };
        return wrapped;
      }),
      RxJs.tap((e) => console.log("socket", e)),
    );

    // subscribe immediately to fire the handshake and reconnect loops
    this.socketSub = this.socket$.subscribe({
      next: (e) => this.respond(e),
      error: (err) => console.error("WS stream fatal error", err),
      complete: () => console.log("WS stream completed"),
    });

    // still register the stream for downstream usage
    method.streams[streamName] = this.socket$;
  }

  /** clean up when the handler is torn down */
  destroy() {
    this.socketSub?.unsubscribe();
    this.socket?.complete();
    super.destroy?.();
  }

  /** @param {EventLike} event */
  respond(event) {
    console.log("socket respond", event.type);

    let dynamicRows = [];
    const fields = [];
    for (const [key, value] of Object.entries(event.access || {})) {
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
    event.access = Object.fromEntries(fields);
    if (dynamicRows.length > 0) {
      Globals.data.setDynamicRows(dynamicRows);
    }

    super.respond(event);
  }

  sendData() {
    if (!this.socket) return;

    // construct and send message
    const name = this.method.Name.value;
    const message = {
      method: name,
      stateName: this.StateName.value,
      URL: this.URL.value,
      state: Globals.state.values,
    };
    const filters = this.filters;
    if (filters.length > 0) {
      const content = Globals.data.getMatchingRows(
        filters,
        false,
      );
      message.content = content;
    }
    this.socket.next(message);
  }
}

TreeBase.register(SocketHandler, "SocketHandler");

