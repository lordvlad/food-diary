import { autobind, html, reload } from './util.mjs'

const swMessage = 'swMessage'
const message = 'message'
const updatefound = 'updatefound'
const { serviceWorker } = navigator

export const events = { swMessage }

export const store = async (_, emitter) => {
  const { emit } = autobind(emitter)
  const registration = await serviceWorker.register('./sw.js')
  const updated = _ => {
    const click = e => { e.preventDefault(); emit(reload) }
    emit('toast', html`Application updated.
      <a href=# onclick=${click}>Click here</a> to reload.`)
  }
  serviceWorker.addEventListener(message, e => emit(swMessage, e.data))
  registration.addEventListener(updatefound, _ => {
    if (!registration.installing && registration.active) {
      // new worker already activated
      updated()
    } else if (registration.installing) {
      // new worker in installation phase
      registration.installing.addEventListener('statechange', _ => {
        if (registration.installing && registration.installing.state === 'activated') updated()
      })
    } else {
      console.error('ran into unhandled state')
      console.dir(registration)
    }
  })
}
