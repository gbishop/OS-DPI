var GHPATH = "/OS-DPI";
var APP_PREFIX = "osdpi_";
var VERSION = "2024-0-11-16-25-29";
var URLS = [
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/index.css`,
  `${GHPATH}/index.js`,
  `${GHPATH}/xlsx.js`
];
var CACHE_NAME = APP_PREFIX + VERSION;
self.addEventListener("fetch", function(e) {
  const url = new URL(e.request.url);
  if (URLS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(function(request) {
        if (request) {
          return request;
        } else {
          return fetch(e.request);
        }
      })
    );
  }
});
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS);
    })
  );
});
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      var cacheWhitelist = keyList.filter(function(key) {
        return key.indexOf(APP_PREFIX);
      });
      cacheWhitelist.push(CACHE_NAME);
      return Promise.all(
        keyList.map(function(key, i) {
          if (cacheWhitelist.indexOf(key) === -1) {
            return caches.delete(keyList[i]);
          }
        })
      );
    })
  );
});
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    /** @type {unknown} */
    self.skipWaiting();
  }
});
//# sourceMappingURL=service-worker.js.map
