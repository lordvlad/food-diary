const { json, send } = require('micro')
const { load } = require('./store')

module.exports = async (req, res) => {
  try {
    const { endpoint } = await json(req)
    const test = s => s.endpoint === endpoint
    const contains = (await load()).some(test)
    console.log(`[OK]   ${endpoint}${contains ? '' : ' not'} known`)
    send(res, contains ? 200 : 404)
  } catch (e) {
    console.error(`[FAIL] ${e.message}`)
    send(res, 500)
  }
}
