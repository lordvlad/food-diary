/* globals workbox, importScripts */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js')

workbox.routing.registerRoute(/.*\.(mjs|js|css|html).*/, workbox.strategies.staleWhileRevalidate())
workbox.routing.registerRoute(/.*\.svg.*/, workbox.strategies.cacheFirst())
workbox.routing.registerRoute('/', workbox.strategies.staleWhileRevalidate())
