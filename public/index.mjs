/* global location */
import { render, reload, autobind, active, choo, html } from './util.mjs'

import { store as assistantStore, view as assistantView } from './assistant.mjs'
import { store as optionsStore, view as optionsView } from './options.mjs'
import { store as diaryStore, view as diaryView } from './diary.mjs'
import { store as notifications } from './notifications.mjs'
import { store as conversation, events as conversationEvents } from './conversation.mjs'
import { store as idbStore, events as idbEvents } from './idb.mjs'

const { load } = idbEvents
const { welcome } = conversationEvents
const { keys, assign } = Object
const app = choo()

const view = (state, emit) => {
  const clickDiary = () => emit('tab', 'diary')
  const clickAssistant = () => emit('tab', 'assistant')
  const activeAssistant = state.tabs.assistant && active
  const activeDiary = state.tabs.diary && active
  const setupComplete = state.options.setupComplete

  return html`
    <body>
      <div class=app>
        ${assistantView(state, emit)}
        ${diaryView(state, emit)}
        ${optionsView(state, emit)}
        ${!setupComplete ? '' : html`
          <div class=nav>
            <div class=nav-center>
              <div class=tabs>
                <a href=# onclick=${clickAssistant} class=${activeAssistant}>assistant</a>
                <a href=# onclick=${clickDiary} class=${activeDiary}>my diary</a>
              </div>
            </div>
          </div>
        `}
      </div>
    </body>
  `
}

const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const tabs = { assistant: true, diary: false, options: false }
  assign(state, { tabs })
  on('tab', tab => { keys(tabs).forEach(k => (tabs[k] = (k === tab))); emit(render) })
}

const offline = _ => navigator.serviceWorker.register('./sw.js', { type: 'module', scope: '/' })
const expose = _ => { window.app = app }
const loader = (_, e) => e.emit(load, { resolve: () => e.emit(welcome) })
const reloader = (_, e) => e.on(reload, () => location.reload())

app.use(reloader)
app.use(offline)
app.use(idbStore)
app.use(notifications)
app.use(conversation)
app.use(assistantStore)
app.use(diaryStore)
app.use(optionsStore)
app.use(store)
app.use(expose)
app.use(loader)

app.view(view)
app.mount('body')
