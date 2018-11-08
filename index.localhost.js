const https = require('https')
const { readFileSync } = require('fs')
const { run } = require('micro')

const PORT = process.env.PORT || 3443

const options = {
  key: readFileSync('./certs/localhost.key'),
  cert: readFileSync('./certs/localhost.crt')
}

const microHttps = fn => https.createServer(options, (req, res) => run(req, res, fn))

const server = microHttps(require('./index.js'))

server.listen(PORT)
console.log(`Listening on https://localhost:${PORT}`)
