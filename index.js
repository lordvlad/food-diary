const { run } = require('micro')
const { createServer } = require('https')
const { readFileSync } = require('fs')
const { router, get, post } = require('microrouter')

/**
 * Serve static files from public directory
 */
const serveHandler = require('serve-handler')
const staticOptions = { 'directoryListing': false, public: 'public' }
const staticServer = (req, res) => serveHandler(req, res, staticOptions)

/**
 * configure routes for micro
 */
const routes = router(
  post('/api/subscribe', require('./api/subscribe.js')),
  post('/api/unsubscribe', require('./api/unsubscribe.js')),
  post('/api/checkSubscription', require('./api/checkSubscription.js')),
  get('/api/health', require('./api/health.js')),
  get('/api/publicKey', require('./api/publicKey.js')),
  get('/api/notify', require('./api/notify.js')),
  get('/*', staticServer)
)

const PORT = process.env.PORT || 3443

const options = {
  key: readFileSync('./certs/localhost.key'),
  cert: readFileSync('./certs/localhost.crt')
}

const server = createServer(options, (req, res) => run(req, res, routes))
server.listen(PORT)
console.log(`Listening on https://localhost:${PORT}`)
