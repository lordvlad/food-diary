import { autobind, html, reload } from './util.mjs'

const swMessage = 'swMessage'
const message = 'message'
const updatefound = 'updatefound'
const { serviceWorker } = navigator

export const events = { swMessage }

export const store = async (_, emitter) => {
  const { emit } = autobind(emitter)
  const registration = await serviceWorker.register('./sw.js')
  const click = e => { e.preventDefault(); emit(reload) }
  const onmessage = e => emit(swMessage, e.data)
  const updated = _ => emit('toast', html`
    Application updated. <a href=# onclick=${click}>Click here</a> to reload.`)
  const statechange = _ => { if (registration.installing.state === 'activated') updated() }
  const onupdatefound = _ => registration.installing.onstatechange(statechange)
  serviceWorker.addEventListener(message, onmessage)
  registration.addEventListener(updatefound, onupdatefound)
}
