const { send } = require('micro')
const { load } = require('./store.js')
const webpush = require('@lordvlad/web-push')
const { GCM_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env

webpush.setVapidDetails('http://food-diary.now.sh', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
webpush.setGCMAPIKey(GCM_API_KEY)

module.exports = async (req, res) => {
  try {
    const payload = 'wake up!'
    const subscriptions = await load()
    console.log(`[]     Broadcasting to ${subscriptions.size} clients`)
    for (let subscription of subscriptions) {
      const { endpoint } = subscription
      try {
        await webpush.sendNotification(subscription, payload)
        console.log(`[OK]   ${endpoint} notified`)
      } catch (e) {
        console.error(`[FAIL] ${endpoint} not notified: ${e.message}`)
      }
    }
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.message}`)
    send(res, 500)
  }
}
