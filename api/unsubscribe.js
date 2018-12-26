const { json, send } = require('micro')
const store = require('../lib/store')
var crypto = require('crypto')
const hash = str => crypto.createHash('md5').update(str).digest('hex')

module.exports = async (req, res) => {
  try {
    const { endpoint } = await json(req)
    if (!endpoint) return send(res, 400, 'request is missing the "endpoint" property')
    const documentId = hash(endpoint)
    await store.collection('subscriptions').doc(documentId).delete()
    console.log(`/unsubscribe [INFO] ${endpoint.substr(0, 64)} unsubscribed`)
    send(res, 200)
  } catch (e) {
    console.error(`/unsubscribe [ERROR] ${e.stack}`)
    send(res, 500)
  }
}
