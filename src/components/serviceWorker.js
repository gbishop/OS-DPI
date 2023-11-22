// Interface to the service worker for offline

import { html } from "uhtml";
import "css/serviceWorker.css";

/** A pointer to the service worker
 * @type {ServiceWorkerRegistration} */
let registration;

/**
 * Ask the service worker to check for an update
 */
export function workerCheckForUpdate() {
  if (registration) {
    registration.update();
  }
}

/**
 * Show the update button when an update is available
 */
function signalUpdateAvailable() {
  document.body.classList.add("update-available");
}

// only start the service worker in production mode
if (import.meta.env.PROD && navigator.serviceWorker) {
  window.addEventListener("load", async () => {
    registration = await navigator.serviceWorker.register("service-worker.js", {
      scope: "/OS-DPI/",
    });
    // ensure the case when the updatefound event was missed is also handled
    // by re-invoking the prompt when there's a waiting Service Worker
    if (registration.waiting) {
      signalUpdateAvailable();
    }

    // detect Service Worker update available and wait for it to become installed
    registration.addEventListener("updatefound", () => {
      if (registration.installing) {
        // wait until the new Service worker is actually installed (ready to take over)
        registration.installing.addEventListener("statechange", () => {
          if (registration.waiting) {
            // if there's an existing controller (previous Service Worker), show the prompt
            if (navigator.serviceWorker.controller) {
              signalUpdateAvailable();
            } else {
              // otherwise it's the first install, nothing to do
              console.log("Service Worker initialized for the first time");
            }
          }
        });
      }
    });

    let refreshing = false;

    // detect controller change and refresh the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  });
}

/**
 * Return a button for updating the service worker
 * CSS assures this is only visible when an update is available
 * @returns {Hole}
 */
export function workerUpdateButton() {
  return html`<button
    id="update-available-button"
    onclick=${() => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage("SKIP_WAITING");
      }
    }}
    title="Click to update the app"
  >
    Update
  </button>`;
}
