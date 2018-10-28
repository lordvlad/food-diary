import { app } from './util.mjs'
import * as actions from './actions.mjs'
import view from './view.mjs'
import state from './state.mjs'

app(state, actions, view, document.body).run()
