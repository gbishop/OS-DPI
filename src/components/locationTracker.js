// components/locationTracker.js
import Globals from "app/globals";

export default class LocationTracker {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout:    20_000,
      ...options
    };

    this._watchId           = null;
    this._healthInterval    = null;
    this._lastReverse       = 0;      // timestamp of last reverse lookup
    this._reverseDelayMs    = 2_000;  // min ms between reverse requests
    this._lastPositionTime  = null;   // timestamp of last position update
    this._staleThresholdMs  = 10_000; // warn if no update in 10s
    this._lastAddress       = null;   // to detect address changes
    this._healthIntervalMs  = 5_000;  // run health checks every 5s
  }

  start() {
    if (!("geolocation" in navigator)) {
      console.warn("[LocationTracker] Geolocation API not supported");
      return;
    }

    // Start watching position
    this._watchId = navigator.geolocation.watchPosition(
      this._onPosition.bind(this),
      this._onError.bind(this),
      this.options
    );
    console.log("[LocationTracker] ▶︎ Started watching location");

    // Begin health-check loop
    if (!this._healthInterval) {
      this._healthInterval = setInterval(
        () => this._healthCheck(),
        this._healthIntervalMs
      );
    }
  }

  stop() {
    // Stop geolocation watch
    if (this._watchId != null) {
      navigator.geolocation.clearWatch(this._watchId);
      this._watchId = null;
      console.log("[LocationTracker] ⏹︎ Stopped watching location");
    }
    // Stop health checks
    if (this._healthInterval) {
      clearInterval(this._healthInterval);
      this._healthInterval = null;
    }
  }

  async _onPosition(position) {
    const { latitude, longitude, accuracy } = position.coords;
    const now = Date.now();

    console.log(
      `[LocationTracker] 📍 Lat:${latitude.toFixed(5)}, Lon:${longitude.toFixed(5)}, Acc:${accuracy}m`
    );

    // Update raw coords & timestamp
    Globals.state.update({
      $Latitude:         latitude,
      $Longitude:        longitude,
      $LocationAccuracy: accuracy
    });
    this._lastPositionTime = now;

    // Throttle reverse-geocode calls
    if (now - this._lastReverse > this._reverseDelayMs) {
      this._lastReverse = now;
      try {
        const info = await this._reverseGeocode(latitude, longitude);
        const displayName = info.display_name;

        // Detect address change
        const changed = this._lastAddress !== null && displayName !== this._lastAddress;
        this._lastAddress = displayName;

        // Update human-readable info + change flag
        Globals.state.update({
          $Address:        displayName,
          $PlaceType:      `${info.category}/${info.type}`,
          $AddressChanged: changed
        });
        console.log(
          `[LocationTracker] 🏷️ ${displayName} (${info.category}/${info.type})` +
          (changed ? " — Address changed!" : "")
        );
      } catch (err) {
        console.error("[LocationTracker] Reverse geocode error", err);
        Globals.state.update({ $LocationError: err.message });
      }
    }
  }

  _onError(error) {
    console.error("[LocationTracker] ❌", error.message);
    Globals.state.update({ $LocationError: error.message });
  }

  async _reverseGeocode(lat, lon) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);

    const res = await fetch(url.toString(), {
      headers: {
        "Accept":     "application/json",
        "User-Agent": "MyApp/1.0 (youremail@example.com)"
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      display_name: data.display_name || "",
      category:     data.category     || "",
      type:         data.type         || ""
    };
  }

  async _healthCheck() {
    const now = Date.now();

    // 1) Ensure watchPosition is still running
    if (this._watchId == null) {
      console.warn("[LocationTracker] Health: watchPosition lost → restarting");
      this.start();
      return;
    }

    // 2) Warn if position callback hasn’t fired recently
    if (this._lastPositionTime && now - this._lastPositionTime > this._staleThresholdMs) {
      console.warn("[LocationTracker] Health: position stale (>10s since last update)");
      Globals.state.update({ $HealthWarning: "Position stale" });
    } else {
      Globals.state.update({ $HealthWarning: null });
    }

    // 3) Ping Nominatim with a lightweight GET to confirm reachability
    try {
      const pingUrl = new URL("https://nominatim.openstreetmap.org/reverse");
      pingUrl.searchParams.set("format", "jsonv2");
      pingUrl.searchParams.set("lat", 0);
      pingUrl.searchParams.set("lon", 0);
      pingUrl.searchParams.set("zoom", 0);

      const resp = await fetch(pingUrl.toString(), { method: "GET" });
      if (!resp.ok) {
        console.error(`[LocationTracker] Health: Nominatim ping HTTP ${resp.status}`);
        Globals.state.update({ $HealthError: `Nominatim ${resp.status}` });
      } else {
        Globals.state.update({ $HealthError: null });
      }
    } catch (err) {
      console.error("[LocationTracker] Health: Nominatim ping error", err);
      Globals.state.update({ $HealthError: err.message });
    }
  }
}
