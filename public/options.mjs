import { events as idbEvents } from './idb.mjs'
import { render, raw, autobind, hidden, html } from './util.mjs'

const { assign } = Object

const setName = 'setName'
const setWantsNotifications = 'setWantsNotifications'
const enableNotifications = 'enableNotifications'
const disableNotifications = 'disableNotifications'
const setSetupComplete = 'setSetupComplete'

const { reset, save } = idbEvents

export const events = { setName, enableNotifications, disableNotifications, setSetupComplete, reset }

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)

  const options = {
    name: '',
    wantsNotifications: false,
    setupComplete: false
  }

  assign(state, { options })

  const set = k => v => {
    options[k] = v
    emit(render)
    emit(save)
  }

  on(setName, set('name'))
  on(setWantsNotifications, set('wantsNotifications'))
  on(setSetupComplete, set('setupComplete'))
  on(enableNotifications, _ => emit(setWantsNotifications, true))
  on(disableNotifications, _ => emit(setWantsNotifications, false))
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
