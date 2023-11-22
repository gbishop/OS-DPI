import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import * as RxJs from "rxjs";
import { webSocket } from "rxjs/webSocket";
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
    // set the signal value
    this.Signal.set("socket");

    // arrange to watch for state changes
    // TODO: figure out how to remove these or make them weak
    Globals.state.observe(() => {
      if (Globals.state.hasBeenUpdated(this.StateName.value)) {
        if (!this.socket) {
          // the connect wasn't successfully opened, try again
          console.error("socket is not active");
          return;
        }
        this.sendData();
      }
    });
  }

  /** The websocket wrapper object
   * @type {import("rxjs/webSocket").WebSocketSubject<any> | undefined} */
  socket = undefined;

  /** The stream of events from the websocket
   * @type {RxJs.Observable<EventLike> | undefined} */
  socket$ = undefined;

  /** @param {RxJs.Subject} _stop$ */
  configure(_stop$) {
    const method = this.method;
    const streamName = "socket";
    // only create it once
    if (method.streams[streamName]) return;

    // this is the socket object
    this.socket = webSocket(this.URL.value);

    // this is the stream of events from it
    this.socket$ = this.socket.pipe(
      RxJs.retry({ count: 10, delay: 5000 }),
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
    method.streams[streamName] = this.socket$;
  }

  /** @param {EventLike} event */
  respond(event) {
    console.log("socket respond", event.type);

    /* Incoming data arrives here in the .access property. This code will filter any arrays of objects and
     * include them in the dynamic data
     */
    let dynamicRows = [];
    const fields = [];
    for (const [key, value] of Object.entries(event.access)) {
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
    // pass incoming messages to the response
    super.respond(event);
  }

  sendData() {
    if (!this.socket) return;

    // send the data over the websocket
    const name = this.method.Name.value;
    const message = {
      method: name,
      stateName: this.StateName.value,
      URL: this.URL.value,
      state: Globals.state.values,
    };
    const filters = GridFilter.toContentFilters(this.filters);
    if (filters.length > 0) {
      const content = Globals.data.getMatchingRows(
        filters,
        Globals.state,
        undefined, // no cache for now
        false, // do not pass NULL for the undefined fields
      );
      message["content"] = content;
    }
    this.socket.next(message);
  }
}
TreeBase.register(SocketHandler, "SocketHandler");
