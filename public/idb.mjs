import { get, set } from 'https://unpkg.com/idb-keyval@3.1.0/dist/idb-keyval.mjs'
import { assignDeep, debounce, autobind, reload } from './util.mjs'

const reset = 'reset'
const save = 'save'
const load = 'load'

const keys = ['options', 'entries', 'notifications']

export { get, set }
export const events = { save, load, reset }

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)

  on(save, debounce(1000, () => { for (let k of keys) set(k, state[k]) }))

  on(reset, async () => {
    for (let k of keys) await set(k, null)
    emit(reload)
  })

  on(load, async ({ resolve } = {}) => {
    for (let k of keys) {
      const v = await get(k)
      if (v) assignDeep(state[k], v)
    }
    resolve()
  })
}
