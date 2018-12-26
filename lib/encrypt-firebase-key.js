const { writeFileSync, readFileSync } = require('fs')
const { encrypt } = require('./crypt')
const { ENCRYPTION_KEY } = process.env

const source = `${__dirname}/../private_key.json`
const target = `${__dirname}/private_key`

if (!ENCRYPTION_KEY) throw new Error('Environment variable ENCRYPTION_KEY must be set')

writeFileSync(target, encrypt(readFileSync(source, 'utf8')), 'utf8')

console.log(`done encrypting '${source}' to '${target}' using '${ENCRYPTION_KEY}'`)
