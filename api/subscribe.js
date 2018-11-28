const { json, send } = require('micro')
const { parse } = require('url')
const { store, load } = require('./store')
const fetch = require('node-fetch').default

module.exports = async (req, res) => {
  try {
    const subscription = await json(req)
    const { endpoint } = subscription
    const filter = s => s.endpoint !== endpoint
    await store([...(await load()).filter(filter), subscription])
    console.log(`[+]    ${endpoint} subscribed`)
    const u = parse(req.url)
    setTimeout(() => fetch(`${u.protocol}://${u.host}/api/notify`), 1000)
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.stack}`)
    send(res, 500)
  }
}
