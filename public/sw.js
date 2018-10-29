/* globals idbKeyval, clients, self, workbox, importScripts */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js')
importScripts('https://unpkg.com/idb-keyval@3.1.0/dist/idb-keyval-iife.js')

const { routing, strategies } = workbox

routing.registerRoute(/.*\.(json|mjs|js|css|html).*/, strategies.staleWhileRevalidate())
routing.registerRoute(/.*\.svg.*/, strategies.cacheFirst())
routing.registerRoute('/', strategies.staleWhileRevalidate())

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' })
    .then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('https://food-diary.now.sh')
    })
  )
})

const getMessage = async () => {
  const now = new Date()
  const { entries } = await idbKeyval.get('app')
  const lastEntry = entries.length ? entries[0] : null
  if (lastEntry && ((now.getTime() - lastEntry.time) < ( 2 * 60 * 60 * 1000))) return {}

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

self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    console.log('woke up because of a push notification')
    const { title, body } = await getMessage()
    if (!title) return
    const options = { body, tag: 'entry', kicon: 'icon-128.png', 
      data: { dateOfArrival: Date.now(), primaryKey: '2' } }
    await self.registration.showNotification(title, options)
  })())
})
