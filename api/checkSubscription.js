const { json, send } = require('micro')
const store = require('../lib/store')
var crypto = require('crypto')
const hash = str => crypto.createHash('md5').update(str).digest('hex')

module.exports = async (req, res) => {
  try {
    const { endpoint } = await json(req)
    if (!endpoint) return send(res, 400, 'request is missing the "endpoint" property')
    const documentId = hash(endpoint)
    const matches = await store.collection('subscriptions').doc(documentId).get()
    console.log(`/checkSubscription [INFO] '${endpoint.substr(0, 64)}'${matches ? '' : ' not'} known`)
    send(res, matches ? 200 : 404)
  } catch (e) {
    console.error(`/checkSubscription [ERROR] ${e.message}`)
    send(res, 500)
  }
}
