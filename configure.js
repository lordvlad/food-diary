const { generateVAPIDKeys } = require('web-push')
const { appendFileSync } = require('fs')
const { createInterface } = require('readline')

const rl = createInterface({input: process.stdin, output: process.stdout})

rl.question('Enter GCM API Key: ', gcmApiKey => {
  const keys = generateVAPIDKeys()
  appendFileSync('.gcm_api_key', gcmApiKey)
  appendFileSync('.vapid_public_key', keys.publicKey)
  appendFileSync('.vapid_private_key', keys.privateKey)
  rl.close()
})
