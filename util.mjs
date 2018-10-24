import { h } from 'https://unpkg.com/hyperapp?module'
import hyperx from './hyperx.mjs'

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
    get: (_, icon) => `https://icongr.am/${schema}/${icon.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.svg?size=16`
  })
})

export const i = icons.material
