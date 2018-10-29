const { generateVAPIDKeys } = require('web-push')
const { appendFileSync } = require('fs')
const { createInterface } = require('readline')
const outdent = require('outdent')

const rl = createInterface({input: process.stdin, output: process.stdout})

rl.question('Enter GCM API Key: ', gcmApiKey => {
    const keys = generateVAPIDKeys();
    appendFileSync('.env', outdent`
        NODE_ENV=production
        NOTIFICATION_INTERVAL_MINUTES=60
        GCM_API_KEY=${gcmApiKey}
        VAPID_PUBLIC_KEY=${keys.publicKey}
        VAPID_PRIVATE_KEY=${keys.privateKey} 
    `)
    rl.close()
})


