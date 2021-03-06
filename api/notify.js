const { send } = require('micro')
const fetchModule = require('node-fetch')
const webpush = require('@lordvlad/web-push')
const store = require('../lib/store')
const { stringify } = JSON
const { GCM_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, APP_URL } = process.env
const fetch = fetchModule.default || fetchModule

webpush.setVapidDetails('http://food-diary.now.sh', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
webpush.setGCMAPIKey(GCM_API_KEY)

module.exports = async (req, res) => {
  try {
    const payload = 'wake up!'
    const subscriptions = await store.collection('subscriptions').listDocuments()
    console.log(`/notify [INFO] Broadcasting to ${subscriptions.length} clients`)
    for (let subscription of subscriptions) {
      const { endpoint } = subscription
      try {
        await webpush.sendNotification(subscription, payload)
        console.log(`/notify [INFO]   ${endpoint.substr(0, 64)} notified`)
      } catch (e) {
        console.error(`/notify [ERROR] ${endpoint.substr(0, 64)} not notified: ${e.stack}`)
        await fetch(`${APP_URL}/api/unsubscribe`, { method: 'POST', body: stringify({ endpoint }) })
      }
    }
    send(res, 200)
  } catch (e) {
    console.error(`/notify [ERROR] ${e.message}\n${e.stack}`)
    send(res, 500)
  }
}
