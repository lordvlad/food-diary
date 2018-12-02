/* globals Image, location */

const { keys, assign } = Object

export const defer = (fn) => new Promise(fn)

export const reload = 'reload'
export const render = 'render'
export const hidden = 'is-hidden'
export const active = 'active'
export const immediate = true
export const contact = 'contact the developer via https://github.com/lordvlad/food-diary/issues'

export const choo = window.choo
export const html = window.html
export const randomId = () => Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)
export const autobind = o => new Proxy(o, { get: (t, k) => t[k] && t[k].apply ? t[k].bind(t) : t[k] })

export const foodSizes = {
  S: 'snack',
  M: 'meal',
  L: 'heavy meal'
}

export const drinkSizes = {
  one: 'one cup / glass',
  two: 'two cups / glasses',
  bottle: 'one bottle'
}

export const severities = ['mild', 'medium', 'severe']
export const stomachNouns = ['bloating', 'constipation', 'diarrhea', 'cramps', 'heartburn']
export const stomachAdjectives = ['bloated', 'constipated', 'diarrhea', 'cramped', 'heartburn']
export const headNouns = ['nausea', 'headaches']
export const headAdjectives = ['nauseaus', 'aching']

export const icons = new Proxy({}, {
  get: (_, schema) => new Proxy({}, {
    get: (_, icon) => {
      const src = `https://icongr.am/${schema}/${icon.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.svg?size=16`
      new Image().src = src // preload image in background
      return () => html`<img src="${src}"/>`
    }
  })
})

export const i = icons.material

export const debounce = (wait, fn) => {
  let to
  return (...args) => {
    const later = () => { to = null; fn.apply(null, ...args) }
    clearTimeout(to)
    to = setTimeout(later, wait)
  }
}

export const raw = html => {
  const el = document.createElement('div')
  el.innerHTML = html
  return Array.from(el.childNodes)
}

export const $ = (id) => document.getElementById(id)

export const pick = (o, ...ks) => ks.reduce((r, k) => assign(r, { [k]: o[k] }), {})

export const isObject = x => x && typeof x === 'object'

export const isFn = x => x && typeof x === 'function'

export const isPrimitive = x => !isObject(x) && !isFn(x)

export const assignDeep = (target, ...args) => {
  if (!isObject(target)) throw new Error('target is not an object')
  for (const arg of args) {
    if (!isObject(arg)) throw new Error(`argument ${arg} is not an object`)
    for (const key of keys(arg)) {
      if (isObject(target[key]) && isObject(arg[key])) {
        assignDeep(target[key], arg[key])
      } else {
        target[key] = arg[key]
      }
    }
  }
  return target
}

export const later = fn => setTimeout(fn, 100)
export const expose = (state, emitter) => { window.app = { state, emitter } }
export const reloader = (_, e) => e.on(reload, () => location.reload())
