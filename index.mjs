import { app } from './util.mjs'
import * as actions from './actions.mjs'
import view from './view.mjs'
import state from './state.mjs'

const main = app(state, actions, view, document.body)
main.welcome()

window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
