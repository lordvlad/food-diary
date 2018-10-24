import { app, h } from 'https://unpkg.com/hyperapp@1.2.9/src/index.js?module'
import hyperx from './hyperx.mjs'

export { app }

export const hx = hyperx(h)

export const defer = (fn) => new Promise(fn)

export const randomId = () => Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)

export const icon = (name, classes = '') => !name ? ''
  : hx`<i class="fas fa-fw fa-${name} ${classes.split(' ').map(c => `fa-${c}`).join(' ')}"></i>`

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
    get: (cache, icon) => {
      if (!cache[icon]) cache[icon] = hx`<img src="https://icongr.am/${schema}/${icon.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.svg?size=16"/>`
      return cache[icon]
    }
  })
})

export const i = icons.material
