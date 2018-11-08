/* globals idbKeyval, workbox, importScripts, fetch, clients, self */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js')
importScripts('https://unpkg.com/idb-keyval@3.1.0/dist/idb-keyval-iife.js')

const { routing, strategies } = workbox
const { get } = idbKeyval

routing.registerRoute(/.*\.(json|mjs|js|css|html).*/, strategies.staleWhileRevalidate())
routing.registerRoute(/.*\.svg.*/, strategies.cacheFirst())
routing.registerRoute('/', strategies.staleWhileRevalidate())

self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(onClick()) })
self.addEventListener('push', e => e.waitUntil(onPush()))

const onClick = async () => {
  const clientList = await clients.matchAll({ type: 'window' })
  for (let client of clientList) { if (client.url === '/' && 'focus' in client) return client.focus() }
  if (clients.openWindow) return clients.openWindow('https://food-diary.now.sh')
}

const onPush = async () => {
  console.log('woke up because of a push notification')
  const dateOfArrival = Date.now()
  const response = await fetch(`/echo?cacheBuster=${dateOfArrival}`)
  if (response.ok) console.log('server alive')
  else console.error(response)
  const tag = 'entry'
  const icon = 'icon-128.png'
  const data = { dateOfArrival, primaryKey: '2' }
  const { title, body } = await getMessage()
  if (!title) return
  await self.registration.showNotification(title, { body, tag, icon, data })
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
