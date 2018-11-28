const { json, send } = require('micro')
const { store, load } = require('./store')
const fetch = require('node-fetch').default

module.exports = async (req, res) => {
  try {
    const subscription = await json(req)
    const { endpoint } = subscription
    const filter = s => s.endpoint !== endpoint
    await store([...(await load()).filter(filter), subscription])
    console.log(`[+]    ${endpoint} subscribed`)
    setTimeout(() => fetch(`${process.env.NOW_URL}/api/notify`), 1000)
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.stack}`)
    send(res, 500)
  }
}
