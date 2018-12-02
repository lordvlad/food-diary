import { render, autobind, active, html } from './util.mjs'

const { keys, assign } = Object

export const view = (state, emit) => {
  if (!state.options.setupComplete) return ''
  const clickDiary = e => { e.preventDefault(); emit('tab', 'diary') }
  const clickAssistant = e => { e.preventDefault(); emit('tab', 'assistant') }
  const activeAssistant = state.tabs.assistant && active
  const activeDiary = state.tabs.diary && active

  return html`
    <div class=nav>
      <div class=nav-center>
        <div class=tabs>
          <a href=# onclick=${clickAssistant} class=${activeAssistant}>assistant</a>
          <a href=# onclick=${clickDiary} class=${activeDiary}>my diary</a>
        </div>
      </div>
    </div>
  `
}

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const tabs = { assistant: true, diary: false, options: false }
  assign(state, { tabs })
  on('tab', tab => { keys(tabs).forEach(k => (tabs[k] = (k === tab))); emit(render) })
}
