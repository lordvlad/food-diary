const { json, send } = require('micro')
const { store, load } = require('./store')
const fetchModule = require('node-fetch')
const { APP_URL } = process.env
const fetch = fetchModule.default || fetchModule

module.exports = async (req, res) => {
  try {
    const subscription = await json(req)
    const { endpoint } = subscription
    const filter = s => s.endpoint !== endpoint
    await store([...(await load()).filter(filter), subscription])
    console.log(`[+]    ${endpoint} subscribed`)
    setTimeout(() => fetch(`${APP_URL}/api/notify`), 1000)
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.stack}`)
    send(res, 500)
  }
}
