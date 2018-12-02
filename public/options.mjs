/* global Notification, fetch */
import { later, render, raw, autobind,
  hidden, html, i, defer } from './util.mjs'
import { events as assistantEvents } from './assistant.mjs'

const { assign } = Object
const { stringify } = JSON
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

export const store = async (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const options = {
    name: '',
    wantsNotifications: false,
    setupComplete: false
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

  on(disableNotifications, async _ => {
    const reg = await navigator.serviceWorker.ready
    reg.sync.register('unsubscribe')
  })

  on(checkSubscription, async state => {
    if (!state.options.wantsNotifications) return
    const reg = await navigator.serviceWorker.ready
    reg.sync.register('checkSubscription')
  })

  on(enableNotifications, async ({ resolve, reject } = {}) => {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') { if (reject) return reject(); else return }
    const reg = await navigator.serviceWorker.ready
    reg.sync.register('subscribe')
    if (resolve) resolve()
  })

  on(askForNotifications, async ({ resolve }) => {
    const reject = _ => {
      const message = `That's okay if you don't want notifications, but 
        keep in mind that you'll need to track your meals regularly to find patterns. 
        You can set up notifications via diary > options if you change your mind.`
      emit(addMessage, { icon: i.cellphoneMessage, message })
      emit(disableNotifications)
      resolve()
    }
    const choices = ['Yes, set up notifications', 'No, I don\'t want notifications']
    const question = `Food diary can remind you to track your meals. 
      You can always change your preference in the options, should you change 
      your mind. Do you want to set up notifications now?`
    const wantsNotifications = await defer(resolve => {
      emit(addMessage, { resolve, icon: i.cellphoneMessage, choices, question })
    })
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
