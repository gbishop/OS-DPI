import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import * as RxJs from "rxjs";
import { webSocket } from "rxjs/webSocket";
import Globals from "app/globals";
import { GridFilter } from "components/gridFilter";
import db from "app/db";

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

  configure() {
    const method = this.method;
    const streamName = "socket";
    // only create it once
    if (method.streams[streamName]) return;

    /** Construct an event from the message
     * @param {Object} msg
     * @returns {EventLike}
     */
    function wrap(msg = {}) {
      const event = new Event("socket");
      const wrapped = {
        type: "socket",
        timeStamp: event.timeStamp,
        access: msg,
        target: null,
      };
      return wrapped;
    }

    // this is the stream of events from the socket
    this.socket$ = RxJs.defer(() => {
      // this is the socket object
      this.socket = webSocket({
        url: this.URL.value,
        serializer: (msg) => {
          if (msg instanceof Blob) {
            return msg;
          } else {
            return JSON.stringify(msg);
          }
        },
        binaryType: "blob",
      });
      return this.socket.pipe(RxJs.startWith({ SocketStatus: "connected" }));
    }).pipe(
      RxJs.endWith({ SocketStatus: "closed" }),
      RxJs.catchError((error, _) => {
        return RxJs.concat(
          RxJs.of({ SocketStatus: "error" }),
          RxJs.throwError(() => error),
        );
      }),
      RxJs.retry({
        // retry after errors
        count: 10,
        delay: (error, index) => {
          console.log("socket error", error, index);
          return RxJs.timer(5000);
        },
      }),
      RxJs.repeat({
        // reconnect after close
        count: 10,
        delay: (index) => {
          console.log("socket closed", index);
          return RxJs.timer(5000);
        },
      }),
      RxJs.catchError((_) => {
        // when we run out of retries
        return RxJs.of({ SocketStatus: "failed" });
      }),
      RxJs.tap((msg) => console.log(msg)),
      RxJs.map(wrap),
    );
    method.streams[streamName] = this.socket$;
  }

  /** @param {EventLike} event */
  respond(event) {
    /* Incoming data arrives here in the .access property. This code will filter any arrays of objects and
     * include them in the dynamic data
     */
    let dynamicRows = [];
    const fields = [];
    for (const [key, value] of Object.entries(event.access || {})) {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "object" &&
        value[0] !== null
      ) {
        dynamicRows = dynamicRows.concat(value);
      } else if (key == "FetchImageFromDB") {
        this.sendImage(value);
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
    const filters = this.filters;
    if (filters.length > 0) {
      const content = Globals.data.getMatchingRows(
        filters,
        false, // do not pass NULL for the undefined fields
      );
      message["content"] = content;
    }
    this.socket.next(message);
  }

  /** @param {string} name */
  async sendImage(name) {
    if (!this.socket) return;

    // send the image over the websocket
    const imgBlob = await db.getImageBlob(name);
    this.socket.next(imgBlob);
  }
}
TreeBase.register(SocketHandler, "SocketHandler");
