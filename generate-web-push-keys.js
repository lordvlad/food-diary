const { generateVAPIDKeys } = require('web-push')
const { appendFileSync } = require('fs')

const keys = generateVAPIDKeys();

appendFileSync('.env', `VAPID_PUBLIC_KEY=${keys.publicKey}\n`)
appendFileSync('.env', `VAPID_PRIVATE_KEY=${keys.privateKey}\n`)

