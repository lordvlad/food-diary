import { h } from './hyperapp.mjs'
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
