/* globals workbox, importScripts */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js')

workbox.routing.registerRoute(/.*\.(mjs|js|css|html)/, workbox.strategies.networkFirst())
workbox.routing.registerRoute('/', workbox.strategies.networkFirst())
