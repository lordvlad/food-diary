/* global Notification, fetch */
import { urlBase64ToUint8Array, later, render, raw, autobind,
  hidden, html, i, contact, defer } from './util.mjs'
import { events as assistantEvents } from './assistant.mjs'

const { assign } = Object
const { parse, stringify } = JSON
const { addMessage } = assistantEvents

const reset = 'reset'
const setName = 'setName'
const setWantsNotifications = 'setWantsNotifications'
const setSubscription = 'setSubscription'
const enableNotifications = 'enableNotifications'
const disableNotifications = 'disableNotifications'
const setSetupComplete = 'setSetupComplete'
const loadComplete = 'loadComplete'
const askForNotifications = 'askForNotifications'
const checkSubscription = 'checkSubscription'

export const events = {
  setName,
  enableNotifications,
  disableNotifications,
  loadComplete,
  setSetupComplete,
  askForNotifications,
  reset,
  checkSubscription
}

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
  const options = {
    name: '',
    wantsNotifications: false,
    setupComplete: false,
    subscription: null
  }

  assign(state, { options })

  const set = key => async value => {
    options[key] = value
    emit(render)
    const response = await fetch(`/store/options/${key}`, { method: 'POST', body: stringify(value) })
    if (!response.ok) {
      // FIXME add code to handle errors
      console.error(response)
    }
  }

  on(setName, set('name'))
  on(setWantsNotifications, set('wantsNotifications'))
  on(setSetupComplete, set('setupComplete'))
  on(setSubscription, set('subscription'))
  on(enableNotifications, _ => emit(setWantsNotifications, true))
  on(disableNotifications, _ => emit(setWantsNotifications, false))

  on(disableNotifications, async ({ resolve } = {}) => {
    if (options.subscription) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) await subscription.unsubscribe()
      const body = stringify(options.subscription)
      const response = await fetch('/api/unsubscribe', { method: 'POST', body })
      if (!response.ok) console.error(response)
      options.subscription = null
    }
    if (resolve) resolve(false)
  })

  on(checkSubscription, async () => {
    if (!options.subscription) return
    const body = stringify(options.subscription)
    const response = await fetch('/api/checkSubscription', { method: 'POST', body })
    if (response.ok) return
    try {
      const { response, subscription } = await subscribe()
      if (!response.ok) return console.error(response)
      options.subscription = parse(stringify(subscription))
    } catch (e) {
      console.error(e)
    }
  })

  on(enableNotifications, async ({ resolve, reject } = {}) => {
    try {
      const { response, subscription } = await subscribe()
      if (response.ok) {
        const message = `Notifications successfully set up`
        options.subscription = parse(stringify(subscription))
        emit(addMessage, { message, icon: i.cellphoneMessage })
        if (resolve) resolve(true)
      } else {
        const message = `Notifications were not set up successfully. Try again 
          in a little while or ${contact}.`
        options.subscription = null
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

  later(async _ => {
    const response = await fetch('/store/options?object=true')
    if (response.ok) assign(options, await response.json())
    emit(loadComplete)
  })
}

export const view = ({ tabs, options }, emit) => html`
  <div class="${tabs.options || hidden} container">
    <h4><span>${raw('\u00A0')}</span><span class=pull-right>options</span></h4>
    <p class=card>
      <p>Your Name</p>
      <input type=text value=${options.name || ''}
        placeholder="Jane Doe"
        onblur=${e => emit(setName, e.target.value)}
        onkeyup=${e => { if (e.keyCode !== 13) return; e.preventDefault(); emit('setName', e.target.value) }}>
    </p>
    <p class=card>
      <p>Notifications</p>
      <p>
        <button 
          onclick=${() => emit(enableNotifications)}
          class="button primary ${options.wantsNotifications || 'outline'}">
        enabled
        </button>
        <button 
          onclick=${() => emit(disableNotifications)}
          class="button primary ${options.wantsNotifications && 'outline'}">
        disabled
        </button>
      </p>
    </p>
    <p class=card>
      <p>Reset all user data</p>
      <p>
        <button onclick=${() => emit(reset)} class="button error">reset</button>
      </p>
    </p>
    <p class=card>
      <p>
        Find out more about Food Diary on <a target=_new href="https://github.com/lordvlad/food-diary/blob/master/README.md">github</a>.
      </p>
      <p>
        Favicons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> are licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>.
      </p>
    </p>
  </div>
`
