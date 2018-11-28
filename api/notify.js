const { send } = require('micro')
const fetchModule = require('node-fetch')
const webpush = require('@lordvlad/web-push')
const { load } = require('./store')
const { stringify } = JSON
const { GCM_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, APP_URL } = process.env
const fetch = fetchModule && fetchModule.default || fetchModule

webpush.setVapidDetails('http://food-diary.now.sh', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
webpush.setGCMAPIKey(GCM_API_KEY)

module.exports = async (req, res) => {
  try {
    const payload = 'wake up!'
    const subscriptions = await load()
    console.log(`[]     Broadcasting to ${subscriptions.length} clients`)
    for (let subscription of subscriptions) {
      const { endpoint } = subscription
      try {
        await webpush.sendNotification(subscription, payload)
        console.log(`[OK]   ${endpoint} notified`)
      } catch (e) {
        console.error(`[FAIL] ${endpoint} not notified: ${e.stack}`)
        await fetch(`${APP_URL}/api/unsubscribe`, { method: 'POST', body: stringify({ endpoint }) })
      }
    }
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.stack}`)
    send(res, 500)
  }
}
