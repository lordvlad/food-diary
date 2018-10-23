import { app } from 'https://unpkg.com/hyperapp?module'
import * as actions from './actions.mjs'
import view from './view.mjs'
import state from './state.mjs'
const main = app(state, actions, view, document.body)
main.welcome()

function onKeyboardPop (fn) {
  let lastWidth = window.innerWidth
  let lastHeight = window.innerHeight
  window.onresize = () => {
    if (window.innerWidth !== lastWidth) return
    if (window.innerHeight < 0.9 * lastHeight) {
      lastHeight = window.innerHeight
      fn(true)
    } else if (window.innerHeight > 1.1 * lastHeight) {
      lastHeight = window.innerHeight
      fn(false)
    }
  }
}

onKeyboardPop(() => main.scrollToBottom())

window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
window.addEventListener('online', () => main.setOffline(false))
window.addEventListener('offline', () => main.setOffline(true))
