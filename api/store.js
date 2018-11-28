const fetch = require('node-fetch').default
const { stringify } = JSON
const storeUrl = process.env.KEYVALUE_XYZ_URL

const load = async _ => {
  console.log(`loading from ${storeUrl}`)
  const response = await fetch(storeUrl)
  try { return await response.json() } catch (e) { return [] }
}

const store = async subscriptions => {
  console.log(`storing ${subscriptions.length} subscriptions to ${storeUrl}`)
  const body = stringify(subscriptions)
  const response = await fetch(storeUrl, { method: 'POST', body })
  if (!response.ok) throw new Error(response.statusText)
}

module.exports = { store, load }
