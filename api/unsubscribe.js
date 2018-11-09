const { json, send } = require('micro')
const { store, load } = require('./store.js')

module.exports = async (req, res) => {
  try {
    const { endpoint } = await json(req)
    const filter = s => s.endpoint !== endpoint
    const subscriptions = (await load()).filter(filter)
    await store(subscriptions)
    console.log(`[-]    ${endpoint} unsubscribed`)
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.message}`)
    send(res, 500)
  }
}
