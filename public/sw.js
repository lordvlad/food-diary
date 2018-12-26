/* globals atob, fetch, URLSearchParams, Response, idbKeyval, workbox, importScripts, self */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js')
importScripts('https://unpkg.com/idb-keyval@3.1.0/dist/idb-keyval-iife.js')

workbox.setConfig({ debug: false })

const { registration, clients, skipWaiting } = self
const { core, routing, strategies } = workbox
const { Store, keys, del, clear, set, get } = idbKeyval
const { stringify } = JSON
const addEventListener = self.addEventListener.bind(self)
const registerRoute = routing.registerRoute.bind(routing)
const staleWhileRevalidate = strategies.staleWhileRevalidate.bind(strategies)
const cacheFirst = strategies.cacheFirst.bind(strategies)

let publicKey = null
let lastCronTick = 1

core.setLogLevel(core.LOG_LEVELS.error)

const postMessage = async msg => {
  for (const client of await self.clients.matchAll()) client.postMessage(msg)
}

const queryParams = url => {
  const o = {}
  for (const [k, v] of url.searchParams.entries()) o[k] = v
  return o
}

class StoreRestAdapter {
  constructor (name) { this._store = new Store(name, name) }
  async getItem (key) { return get(key, this._store) }
  async del (key) { return del(key, this._store) }
  async set (key, val) { return set(key, val, this._store) }
  async keys () { return keys(this._store) }
  async clear () { return clear(this._store) }
  async * entries ({ min = 0, max = Number.POSITIVE_INFINITY }) {
    let i = -1
    for (const k of await this.keys()) {
      i++
      if (i < min) continue
      if (i >= max) return
      yield [k, await this.getItem(k)]
    }
  }
  async DELETE ({ params: [key] }) { await this.del(key); return new Response(null) }
  async GET ({ query, params }) {
    const headers = { 'Content-Type': 'application/json' }
    if (params[1]) {
      const key = params[1]
      const item = await this.getItem(key)
      const body = item ? stringify(item) : null
      const status = item ? 200 : 404
      return new Response(body, { status, headers })
    }
    const pageSize = parseInt(query.pageSize || 40)
    const min = parseInt(query.page || 0) * pageSize
    const max = min + pageSize
    const collectArray = async _ => {
      const array = []
      for await (const [, v] of this.entries({ min, max })) {
        array.push(v)
      }
      return array
    }
    const collectObject = async _ => {
      const object = {}
      for await (const [k, v] of this.entries({ min, max })) {
        object[k] = v
      }
      return object
    }
    const body = stringify(await (query.object ? collectObject() : collectArray()))
    const init = { status: 200, headers }
    return new Response(body, init)
  }
  async POST ({ params, event: { request } }) {
    const entry = await request.json()
    const key = params[1] || entry.key || entry.time
    await this.set(key, entry)
    return new Response('ok', { status: 200 })
  }
}

const stores = new Proxy({}, {
  get: (cache, key) => {
    if (!cache[key]) cache[key] = new StoreRestAdapter(key)
    return cache[key]
  }
})

const storeHandler = async ({ url, event, params }) => {
  const method = event.request.method
  const query = queryParams(url)
  const store = params[0].replace(url.search, '')
  return stores[store][method]({ url, event, params, query })
}

const onClick = async e => {
  e.notification.close()
  const clientList = await clients.matchAll({ type: 'window' })
  for (let client of clientList) { if (client.url === '/' && 'focus' in client) return client.focus() }
  if (clients.openWindow) return clients.openWindow('https://food-diary.now.sh')
}

const onPush = async () => {
  console.log('woke up because of a push notification')
  const dateOfArrival = Date.now()
  lastCronTick = dateOfArrival
  const tag = 'entry'
  const icon = 'img/icon-128.png'
  const data = { dateOfArrival, primaryKey: '2' }
  const { title, body } = await getMessage()
  if (title) await registration.showNotification(title, { body, tag, icon, data })
}

const getMessage = async () => {
  const now = new Date()
  const entries = await get('entries') || []
  const lastEntry = entries.length ? entries[0] : null
  if (lastEntry && ((now.getTime() - lastEntry.time) < (2 * 60 * 60 * 1000))) return {}

  switch (now.getHours()) {
    case 8:
    case 9:
      return { title: 'Good morning!', body: 'Did you sleep well? What did you have for breakfast?' }
    case 10:
    case 11:
      return { title: 'Hey there!', body: 'How was your morning? Are you feeling well?' }
    case 12:
    case 13:
      return { title: 'Hello there!', body: 'Have you had your lunch already? What did you have?' }
    case 16:
    case 17:
      return { title: 'Hello there!', body: 'How is your day? Are you feeling well?' }
    case 19:
    case 20:
      return { title: 'Good evening!', body: 'What\'s for dinner today?' }
    case 22:
    case 23:
      return { title: 'Good night!', body: 'Are you ready for bed? How do you feel?' }
    default:
      return {}
  }
}

const onInstall = async _ => {
  for (const k of ['options', 'entries']) await stores[k].keys()
  publicKey = await (await fetch('/api/publicKey')).text()
  skipWaiting()
  postMessage({ toast: 'Webapp installed.' })
}

const onActivate = async _ => clients.claim()

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const subscribe = async _ => {
  const oldSubscription = await registration.pushManager.getSubscription()
  if (oldSubscription) {
    const body = stringify(oldSubscription)
    const response = await fetch('/api/checkSubscription', { method: 'POST', body })
    if (response.ok) return
  }
  const applicationServerKey = urlBase64ToUint8Array(publicKey)
  const userVisibleOnly = true
  const subscription = await registration.pushManager.subscribe({ applicationServerKey, userVisibleOnly })
  const body = stringify(subscription)
  const response = await fetch('/api/subscribe', { method: 'POST', body })
  if (!response.ok) console.error(response)
  else postMessage({ toast: `Notifications ${oldSubscription ? 'reconfigured' : 'enabled'}.` })
}

const unsubscribe = async _ => {
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await subscription.unsubscribe()
  const body = stringify(subscription)
  const response = await fetch('/api/unsubscribe', { method: 'POST', body })
  if (!response.ok) console.error(response)
  else postMessage({ toast: 'Notifications disabled.' })
}

const onSync = async e => {
  if (e.tag === 'subscribe' || e.tag === 'checkSubscription') subscribe()
  else if (e.tag === 'unsubscribe') unsubscribe()
}

addEventListener('notificationclick', e => e.waitUntil(onClick(e)))
addEventListener('push', e => e.waitUntil(onPush(e)))
addEventListener('activate', e => e.waitUntil(onActivate(e)))
addEventListener('install', e => e.waitUntil(onInstall(e)))
addEventListener('sync', e => e.waitUntil(onSync(e)))

registerRoute(/\/last-tick/, _ => new Response(lastCronTick, { status: 200 }), 'GET')
registerRoute(/\/store\/(?<store>[^/]+)\/(?<id>.+)/, storeHandler, 'GET')
registerRoute(/\/store\/(?<store>[^/]+)\/(?<id>.+)/, storeHandler, 'POST')
registerRoute(/\/store\/(?<store>[^/]+)/, storeHandler, 'GET')
registerRoute(/\/store\/(?<store>[^/]+)/, storeHandler, 'POST')
registerRoute(/\/store\/(?<store>[^/]+)/, storeHandler, 'DELETE')
registerRoute('/', cacheFirst())
registerRoute(/.*\.(json|mjs|js|css|html).*/, staleWhileRevalidate())
registerRoute(/.*\.(svg|png).*/, cacheFirst())
