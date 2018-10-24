import { app } from 'https://unpkg.com/hyperapp@1.2.9/src/index.js?module'
import * as actions from './actions.mjs'
import view from './view.mjs'
import state from './state.mjs'

const main = app(state, actions, view, document.body)
main.welcome()

window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
