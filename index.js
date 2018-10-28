const { json, send } = require('micro')
const { router, get, post } = require('microrouter')

/**
 * Serve static files from public directory
 */
const serveHandler = require('serve-handler')
const staticOptions = { 'directoryListing': false, public: 'public' }
const static = (req, res) => serveHandler(req, res, staticOptions)

/**
 * Set up web push configuration with vapid keys and google cloud messaging
 * api key as a fallback
 */
const webpush = require('web-push')
const subscriptions = new Map()
const { GCM_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
webpush.setVapidDetails('http://food-diary.now.sh', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
webpush.setGCMAPIKey(GCM_API_KEY)

/** 
 * Subscribe a client to push notifications
 * @param {Request} req 
 * @param {Response} res 
 */
const subscribe = async (req, res) => { 
    const subscription = await json(req)
    subscriptions.set(subscription.endpoint, subscription)
    console.log(`subscription added ${subscription.endpoint}`)
    if (broadCastTimeout) { clearTimeout(broadCastTimeout); broadCastTimeout=null }
    broadCastTimeout = setTimeout(broadcast, 10 * 1000)
    send(res, 204)
}

/**
 * Unsubscribe a client from push notifications
 * @param {Request} req 
 * @param {Response} res 
 */
const unsubscribe = async (req, res) => { 
    const subscription = await json(req)
    subscriptions.delete(subscription.endpoint)
    console.log(`subscription deleted ${subscription.endpoint}`)
    send(res, 204)
}

/**
 * Check if a client subscription is valid. Sends a HTTP 204 response if it is valid,
 * 404 if not.
 * @param {Request} req 
 * @param {Response} res 
 */
const checkSubscription = async (req, res) => {
    const { endpoint } = await json(req)
    send(res, subscriptions.has(endpoint) ? 204 : 404)
}


let broadCastTimeout = null
const { NOTIFICATION_INTERVAL_MINUTES } = process.env
/**
 * Broadcast a payload across all subscribed clients
 * @param {*} payload 
 */
const broadcast = async (payload = 'heartbeat') => { 
    broadCastTimeout = null
    console.group(`${new Date()} broadcasting to ${subscriptions.size} clients`)
    console.log(payload)
    for (let [endpoint, subscription] of subscriptions) {
        try {
            await webpush.sendNotification(subscription, payload)
            console.log(`message send to ${endpoint}`)
        }
        catch (e) {
            console.error(`failed to send message to ${endpoint}`, e)
        }
    }
    console.groupEnd()
    if (broadCastTimeout) { clearTimeout(broadCastTimeout); broadCastTimeout = null }
    broadCastTimeout = setTimeout(broadcast, (NOTIFICATION_INTERVAL_MINUTES || 5) * 60 * 1000)
}

/**
 * configure routes for micro
 */
module.exports = router(
    post('/subscribe', subscribe),
    post('/unsubscribe', unsubscribe),
    post('/checkSubscription', checkSubscription),
    get('/publicKey', () => VAPID_PUBLIC_KEY),
    get('/*', static)
)