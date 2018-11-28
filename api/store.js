const fetch = require('node-fetch').default
const { stringify } = JSON
const storeUrl = process.env.KEYVALUE_XYZ_URL

const load = async _ => {
  const response = await fetch(storeUrl)
  try { return await response.json() } catch (e) { return [] }
}

const store = async subscriptions => {
  const body = stringify(subscriptions)
  const response = await fetch(storeUrl, { method: 'POST', body })
  if (!response.ok) throw new Error(response.statusText)
}

module.exports = { store, load }
