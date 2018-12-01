/* global location */
import 'https://unpkg.com/nanochoo@6.13.0/dist/bundle.js'
import 'https://unpkg.com/nanohtml@1.2.6/dist/bundle.js'

import { render, reload, autobind, active, choo, html } from './util.mjs'

import { store as assistantStore, view as assistantView } from './assistant.mjs'
import { store as optionsStore, view as optionsView } from './options.mjs'
import { store as diaryStore, view as diaryView } from './diary.mjs'
import { store as conversation } from './conversation.mjs'

const { keys, assign } = Object
const app = choo()

const view = (state, emit) => {
  const clickDiary = e => { e.preventDefault(); emit('tab', 'diary') }
  const clickAssistant = e => { e.preventDefault(); emit('tab', 'assistant') }
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

const navStore = (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const tabs = { assistant: true, diary: false, options: false }
  assign(state, { tabs })
  on('tab', tab => { keys(tabs).forEach(k => (tabs[k] = (k === tab))); emit(render) })
}

const offline = _ => navigator.serviceWorker.register('./sw.js')
const expose = _ => { window.app = app }
const reloader = (_, e) => e.on(reload, () => location.reload())

app.use(reloader)
app.use(offline)
app.use(conversation)
app.use(assistantStore)
app.use(diaryStore)
app.use(optionsStore)
app.use(navStore)
app.use(expose)

app.view(view)
app.mount('body')
