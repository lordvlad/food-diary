const outdent = require('outdent')
const fetch = require('node-fetch')
const { generateVAPIDKeys } = require('@lordvlad/web-push')
const { createInterface } = require('readline')

;(async () => {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const xyzUrl = await (await fetch('https://api.keyvalue.xyz/new/food-diary', { method: 'POST' })).text()

  rl.question('Enter GCM API Key: ', gcmApiKey => {
    const keys = generateVAPIDKeys()
    console.log(outdent`
    now you need to execute:
      now secret add NODE_ENV production
      now secret add GCM_API_KEY j${gcmApiKey}
      now secret add VAPID_PUBLIC_KEY ${keys.publicKey}
      now secret add VAPID_PRIVATE_KEY ${keys.privateKey}
      now secret add KEYVALUE_XYZ_URL ${xyzUrl}
    `)
    rl.close()
  })
})()
