/* globals fetch, Notification */
import { i, contact, urlBase64ToUint8Array, defer, autobind } from './util.mjs'
import { events as assistantEvents } from './assistant.mjs'
import { events as optionsEvents } from './options.mjs'
import { events as idbEvents } from './idb.mjs'

const { assign } = Object
const { stringify, parse } = JSON
const { save } = idbEvents
const { addMessage } = assistantEvents
const { enableNotifications, disableNotifications } = optionsEvents

const askForNotifications = 'askForNotifications'
const checkSubscription = 'checkSubscription'

export const events = { checkSubscription, askForNotifications }

const subscribe = async () => {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('denied')
  const registration = await navigator.serviceWorker.ready
  const publicKey = await (await fetch('/api/publicKey')).text()
  const appServerKey = urlBase64ToUint8Array(publicKey)
  const subscription = await registration.pushManager.subscribe({ appServerKey, userVisibleOnly: true })
  const body = stringify(subscription)
  const response = await fetch('/api/subscribe', { method: 'POST', body })
  return { subscription, response }
}

export const store = async (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const notifications = { subscription: null }
  assign(state, { notifications })

  on(checkSubscription, async () => {
    if (!notifications.subscription) return
    const body = stringify(notifications.subscription)
    const response = await fetch('/api/checkSubscription', { method: 'POST', body })
    if (response.ok) return
    try {
      const { response, subscription } = await subscribe()
      if (!response.ok) return console.error(response)
      notifications.subscription = parse(stringify(subscription))
      emit(save)
    } catch (e) {
      console.error(e)
    }
  })

  on(disableNotifications, async ({ resolve } = {}) => {
    if (notifications.subscription) {
      const body = stringify(notifications.subscription)
      const response = await fetch('/api/unsubscribe', { method: 'POST', body })
      if (!response.ok) console.error(response)
      notifications.subscription = null
    }
    if (resolve) resolve(false)
  })

  on(enableNotifications, async ({ resolve, reject } = {}) => {
    try {
      const { response, subscription } = await subscribe()
      if (response.ok) {
        const message = `Notifications successfully set up`
        notifications.subscription = parse(stringify(subscription))
        emit(save)
        emit(addMessage, { message, icon: i.cellphoneMessage })
        if (resolve) resolve(true)
      } else {
        const message = `Notifications were not set up successfully. Try again 
        in a little while or ${contact}.`
        notifications.subscription = null
        emit(save)
        emit(addMessage, { message, icon: i.cellphoneMessage })
        console.error(response)
        if (resolve) resolve(false)
      }
    } catch (e) {
      reject(e)
    }
  })

  on(askForNotifications, async ({ resolve }) => {
    const reject = () => {
      const message = `That's okay if you don't want notifications, but 
        keep in mind that you'll need to track your meals regularly to find patterns. 
        You can set up notifications via diary > options if you change your mind.`
      emit(disableNotifications)
      emit(addMessage, { icon: i.cellphoneMessage, message })
      resolve(false)
    }
    const choices = ['Yes, set up notifications', 'No, I don\'t want notifications']
    const question = `Food diary can remind you to track your meals. 
      You can always change your preference in the settings, should you change 
      your mind. Do you want to set up notifications now?`
    const wantsNotifications = await defer(resolve => emit(addMessage, { resolve, icon: i.cellphoneMessage, choices, question }))
    if (wantsNotifications !== choices[0]) return reject()
    emit(enableNotifications, { resolve, reject })
  })
}
