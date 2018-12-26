const { json, send } = require('micro')
const store = require('../lib/store')
const { APP_URL } = process.env
const fetchModule = require('node-fetch')
const fetch = fetchModule.default || fetchModule
var crypto = require('crypto')
const hash = str => crypto.createHash('md5').update(str).digest('hex')

module.exports = async (req, res) => {
  try {
    const subscription = await json(req)
    const { endpoint } = subscription
    if (!endpoint) return send(res, 400, 'request is missing the "endpoint" property')
    const documentId = hash(endpoint)
    const doc = store.collection('subscriptions').doc(documentId)
    const response = await doc.set(subscription)
    if (!response.ok) throw new Error(`${doc.url}: ${response.statusText}\n${await response.text()}`)
    console.log(await doc.get())
    console.log(`/subscribe [INFO] ${endpoint.substr(0, 64)} subscribed`)
    setTimeout(() => fetch(`${APP_URL}/api/notify`), 1000)
    send(res, 200)
  } catch (e) {
    console.error(`/subscribe [ERROR] ${e.stack}`)
    send(res, 500)
  }
}
