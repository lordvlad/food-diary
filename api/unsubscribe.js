const { json, send } = require('micro')
const { store, load } = require('./store')

module.exports = async (req, res) => {
  try {
    const { endpoint } = await json(req)
    const filter = s => s.endpoint !== endpoint
    await store((await load()).filter(filter))
    console.log(`[-]    ${endpoint.substr(0, 64)} unsubscribed`)
    send(res, 200)
  } catch (e) {
    console.error(`[FAIL] ${e.stack}`)
    send(res, 500)
  }
}
