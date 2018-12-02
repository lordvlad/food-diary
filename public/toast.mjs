import { swMessage, autobind, render, html } from './util.mjs'

const toast = 'toast'

export const events = { toast }

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)
  on(swMessage, ({ toast }) => { if (toast) emit(events.toast, toast) })
  on(events.toast, toast => { state.toast = toast; emit(render) })
}
export const view = ({ toast } = {}, emit) => {
  if (!toast) return html`<div class="toast"></div>`
  const duration = toast.fade ? 400 : toast.duration || 3000
  const nextToast = toast.fade ? null : { fade: true, message: toast.message || toast }
  setTimeout(() => emit(events.toast, nextToast), duration)
  return html`<div class="toast ${toast.fade ? '' : 'in'}"><p>${toast.message || toast}</p></div>`
}
