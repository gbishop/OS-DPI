import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import * as RxJs from "rxjs";
import Globals from "app/globals";
import { callAfterRender } from "app/render";

/**
Type of the object returned by nominatim

@typedef {Object} NominatimReverseResult
  @property {number} place_id
  @property {string} licence
  @property {string} osm_type
  @property {number} osm_id
  @property {string} lat
  @property {string} lon
  @property {string} display_name
  @property {object} address
  @property {string} address.amenity
  @property {string} address.road
  @property {string} address.suburb
  @property {string} address.city_district
  @property {string} address.city
  @property {string} address.county
  @property {string} address.state
  @property {string} address.postcode
  @property {string} country
  @property {string} country_code
  @property {string[]} boundingbox
}
*/

/**
 * Fetches a human-readable address for a given geographic position using the
 * Nominatim API.
 * @param {GeolocationPosition} position
 */
async function getAddressFromPosition(position) {
  const { latitude, longitude } = position.coords;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  // construct the result I want
  /** @type {EventLike} */
  let result = {
    type: "location",
    target: null,
    timeStamp: position.timestamp,
    access: {
      latitude: position.coords.latitude.toString(),
      longitude: position.coords.longitude.toString(),
      accuracy: position.coords.accuracy.toString(),
    },
  };

  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (response.ok) {
      /** @type {NominatimReverseResult} */
      const r = await response.json();
      // console.log("response from nominatim", r);
      result.access = {
        ...result.access,
        ...r.address,
        display_name: r.display_name,
      };
    }
  } catch (error) {
    console.error("Error fetching address", error);
  }

  return result;
}

export class LocationHandler extends Handler {
  /** @type {string[]} */
  allowedChildren = ["HandlerResponse"];

  StateName = new Props.String("$location");

  /**
   * The value of the controlling state variable enters here
   * @type {RxJs.Subject<boolean>} */
  tracking$ = new RxJs.Subject();

  settings() {
    const { StateName } = this;
    return html`
      <fieldset class="Handler">
        <legend>Location Handler</legend>
        ${StateName.input()}
      </fieldset>
      <fieldset class="Responses">
        <legend>Responses</legend>
        ${this.unorderedChildren(this.responses)}
      </fieldset>
    `;
  }

  init() {
    super.init();
    this.Signal.set("location");
  }

  observer() {
    if (!this) return; // just in case
    // enable or disable tracking
    this.tracking$.next(
      Globals.state.get(this.StateName.value, "") == "tracking",
    );
  }

  configure() {
    const method = this.method;
    const streamName = "location";

    const options = {
      enableHighAccuracy: true,
      timeout: 1000, // 1 second
      maximumAge: 0,
    };

    if (!navigator.geolocation) {
      console.error("Location not supported");
      return;
    }

    /** @type {RxJs.Observable<EventLike>} */
    this.location$ = this.tracking$.pipe(
      // RxJs.tap(console.log),
      // only act on changes
      RxJs.distinctUntilChanged(),
      // RxJs.tap(console.log),
      RxJs.switchMap((tracking) => {
        // console.log("sm", tracking);
        if (tracking) {
          // activate tracking with watchPosition
          return new RxJs.Observable((subscriber) => {
            // console.log("obs");
            let watchId = navigator.geolocation.watchPosition(
              // The success callback: this is called with the position object.
              /** @param {GeolocationPosition} position */
              (position) => {
                // console.log("next", position);
                subscriber.next(position);
              },
              // The error callback: this is called when an error occurs.
              /** @param {GeolocationPositionError} error */
              (error) => {
                subscriber.error(error);
              },
              // The options object to configure the request.
              options,
            );
            return () => {
              navigator.geolocation.clearWatch(watchId);
            };
          }).pipe(
            // retry on error
            RxJs.retry({ delay: 1000 }),
            // don't hammer the geolocation service
            RxJs.throttleTime(10000, undefined, {
              leading: true,
              trailing: false,
            }),
            // RxJs.tap(console.log),
            // map the lat/lon to an address if possible
            RxJs.switchMap((position) =>
              RxJs.from(getAddressFromPosition(position)),
            ),
            // RxJs.tap(console.log),
          );
        } else {
          return RxJs.NEVER;
        }
      }),
    );
    method.streams[streamName] = this.location$;

    const observer = this.observer.bind(this);

    Globals.state.observe(observer, "location", this.StateName.value);
    callAfterRender(observer);
  }

  /** @param {EventLike} event */
  respond(event) {
    super.respond(event);
  }
}

TreeBase.register(LocationHandler, "LocationHandler");
