import 'https://unpkg.com/nanochoo@6.13.0/dist/bundle.js'
import 'https://unpkg.com/nanohtml@1.2.6/dist/bundle.js'

import { reloader, offline, expose, choo, html } from './util.mjs'
import { store as conversation } from './conversation.mjs'
import * as assistant from './assistant.mjs'
import * as options from './options.mjs'
import * as diary from './diary.mjs'
import * as nav from './nav.mjs'
import * as toast from './toast.mjs'

const view = (state, emit) => html`<body><div class=app>
  ${assistant.view(state, emit)}
  ${diary.view(state, emit)}
  ${options.view(state, emit)}
  ${toast.view(state, emit)}
  ${nav.view(state, emit)}
</div></body>`

const app = choo()

app.use(reloader)
app.use(offline)
app.use(conversation)
app.use(expose)

app.use(nav.store)
app.use(assistant.store)
app.use(diary.store)
app.use(options.store)
app.use(toast.store)

app.view(view)
app.mount('body')
