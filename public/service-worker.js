const CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";

const iconSizes = ["192", "512"];
const iconFiles = iconSizes.map((size) => `/icons/icon-${size}x${size}.png`);

const staticFilesToCache = [
    "/",
    "index.js",
    "manifest.webmanifest"
].concat(iconFiles);

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(staticFilesToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if(key !== CACHE && key !== DATA_CACHE) {
                    console.log("Removing old cache data", key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    const {url} = event.request;
    if (url.includes("/all") || url.includes("/find")) {
        event.respondWith(
            caches.open(DATA_CACHE).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        return cachematch(event.request);
                    });
            }).catch(err => console.log(err))
        );
    }else{
        event.respondWith(
            caches.open(CACHE).then(cache => {
                return cache.match(event.request).then(response => {
                    return response || fetch(event.request);
                });
            })
        );
    }
});