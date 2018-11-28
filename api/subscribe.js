const { json, send } = require('micro')
const { store, load } = require('./store')
const fetch = require('node-fetch').default

module.exports = async (req, res) => {
  try {
    const subscription = await json(req)
    const { endpoint } = subscription
    const filter = s => s.endpoint !== endpoint
    const subscriptions = (await load()).filter(filter)
    subscriptions.push(subscription)
    await store(subscriptions)
    console.log(`[+]    ${endpoint} subscribed`)
    setTimeout(() => fetch(`${process.env.NOW_URL}/notify`), 1000)
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.message}`)
    send(res, 500)
  }
}
