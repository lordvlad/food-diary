/* globals localStorage */
import { hx, randomId, defer, icon, stomachAdjectives,
  stomachNouns, headAdjectives, headNouns, severities } from './util.mjs'

const SECONDS = 1000
const MINUTES = SECONDS * 60
const HOURS = MINUTES * 60

const messageSpeedMultiplier = 1200

const { assign } = Object
const immediate = true
const $ = (id) => document.getElementById(id)

let messageTimeout = null
let saveTimeout = null

export const scrollToBottom = () => window.scrollTo(0, document.body.scrollHeight)

export const setOffline = (offline) => ({ offline })

export const diaryTab = () => ({ diaryTab: true, assistantTab: false, optionsTab: false })
export const assistantTab = () => ({ diaryTab: false, assistantTab: true, optionsTab: false })
export const optionsTab = () => ({ diaryTab: false, assistantTab: false, optionsTab: true })

export const setMessageSpeed = messageSpeed => (_, { save }) => { save(); return { messageSpeed } }
export const setName = name => (_, { save }) => { save(); return { name } }

export const saveIcon = (on) => ({ saveIcon: on })
export const doSave = () => async (state) => {
  saveTimeout = null
  localStorage.setItem('app', JSON.stringify(state))
  saveIcon(true)
  setTimeout(() => saveIcon(false), 2000)
}
export const save = () => async (_, { doSave }) => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(doSave, 2000)
}

export const dequeueMessage = () => ({ messages, messageQueue, messageSpeed }, { dequeueMessage, scrollToBottom }) => {
  const message = messageQueue.shift()
  messageTimeout = null
  if (messageQueue.length) messageTimeout = setTimeout(dequeueMessage, messageSpeed * messageSpeedMultiplier)
  if (message.onCreated) setTimeout(message.onCreated, 10)
  setTimeout(scrollToBottom, 10)
  return { messageQueue, messages: [...messages, message] }
}

export const addEntry = entry => ({ entries }, { save }) => {
  save()
  return { entries: [entry, ...entries] }
}

export const addMessage = message => ({ messageQueue, messageSpeed }, { dequeueMessage }) => {
  if (messageTimeout === null) {
    const t = message.immediate ? 10 : messageSpeed * 600
    messageTimeout = setTimeout(dequeueMessage, t)
  }
  return { messageQueue: [...messageQueue, message] }
}

export const askForName = ({ callback }) => async (_, { setName, addMessage, addQuestion }) => {
  const question = 'But first, I\'ll need your name. What should I call you?'
  const name = await defer(callback => addQuestion({ question, callback }))
  addMessage(assign(hx`<p class="card left">Hello, ${name}!</p>`, { immediate }))
  setName(name)
  callback(name)
}

export const askForMessageSpeed = ({ callback }) => async (_, { addChoice, addMessage, setMessageSpeed }) => {
  const question = 'How do you like the message speed? Should I slow down?'
  const choices = ['you\'re too fast', 'just right', 'speak faster to me']
  const multiplier = [1.4, 1.0, 0.6]
  const choice = await defer(callback => addChoice({ question, choices, callback }))
  const index = choices.indexOf(choice)
  switch (index) {
    case 0: addMessage(hx`<p class=card>All right, I'll slow down a little.</p>`); break
    case 1: addMessage(hx`<p class=card>Cool, I'll keep the pace.</p>`); break
    case 2: addMessage(hx`<p class=card>Cool, I'll pick up the pace.</p>`); break
  }
  setMessageSpeed(multiplier[choice])
  callback(multiplier)
}

export const welcome = () => async ({ name }, { addMessage, recordEntry, ...actions }) => {
  const { askForName, askForMessageSpeed, askForFirstMeal } = new Proxy({}, { get: (o, k) => () => defer(callback => actions[k]({ callback })) })
  const hello = () => {
    addMessage(assign(hx`<h1 class=card>Hello!`, { immediate }))
    addMessage(hx`<p class=card>Welcome to your personal food diary. ${icon('hand-peace')}</p>`)
    addMessage(hx`<p class=card>I will help you track everything you eat and drink. And I will track
              how that makes you feel.</p>`)
    addMessage(hx`<p class=card>Together, we will figure out your food intolerances.</p>`)
  }
  if (!name) {
    hello()
    await askForName()
    await askForMessageSpeed()
    await askForFirstMeal()
  } else {
    addMessage(assign(hx`<h1 class=card>Hello, ${name}!`, { immediate }))
    recordEntry()
  }
}

export const addQuestion = ({ question, callback }) => (_, { addMessage }) => {
  const id = randomId()
  const focus = () => $(id).focus()
  const blur = () => $(id).blur()
  const enter = (e) => {
    e.preventDefault()
    blur()
    input.readonly = true
    callback(e.target.value)
  }

  const keydown = (e) => { if (e.keyCode === 13) enter(e) }
  const input = hx`<input id=${id} type=text onkeydown=${keydown}>`
  const card = hx`<p class=card><p>${question}</p><p>${input}</p></p>`
  addMessage(assign(card, { onCreated: focus }))
}

export const addChoice = ({ question, choices, callback }) => (_, { addMessage }) => {
  const id = randomId()
  const click = answer => () => {
    for (let i = 0; i < choices.length; i++) $(`${id}-${i}`).disabled = true
    $(`${id}-${choices.indexOf(answer)}`).classList.remove('outline')
    callback(answer)
  }

  const buttons = choices.map((answer, i) => hx`
    <button class="button primary outline" id="${id}-${i}" onclick=${click(answer)}> ${answer} </button>`)
  const card = hx`<p class=card><p>${question}</p><p>${buttons}</p>`
  addMessage(card)
}

export const askForFirstMeal = ({ callback }) => async (_, { recordMeal }) => {
  const question = hx`<span>${icon('clock')} Now lets start tracking your meals. When was your last meal?</span>`
  recordMeal({ callback, question })
}

export const recordEntry = ({ callback } = {}) => async (_, actions) => {
  const { addChoice, recordMeal, recordDrink, recordStomachAche, recordHeadache } = actions
  const question = hx`What do you want to record?`
  const choices = ['A meal', 'a drink', 'stomach ache', 'headache']
  const choice = await defer(callback => addChoice({ question, choices, callback }))
  const cb = (...args) => {
    if (callback) callback(...args) // eslint-disable-line 
    actions.recordEntry()
  }
  switch (choices.indexOf(choice)) {
    case 0: recordMeal({ callback: cb }); break
    case 1: recordDrink({ callback: cb }); break
    case 2: recordStomachAche({ callback: cb }); break
    case 3: recordHeadache({ callback: cb }); break
  }
}

export const recordDrink = ({ callback } = {}) => async (_, { addQuestion, addEntry }) => {
  const entry = {}
  {
    const question = hx`<span>${icon('wine-glass')} What did you drink? (other than water)`
    const answer = await defer(callback => addQuestion({ question, callback }))
    if (!['no', 'nein'].includes(answer)) entry.drink = answer.split(/\s*,\s*/)
  }
  if (entry.drink && entry.drink.length) {
    const question = hx`<span>${icon('wine-glass')} How many cups or glasses did you have?</span>`
    const choices = ['one', 'two', 'a bottle']
    const choice = await defer(callback => addChoice({ choices, callback, question }))
    entry.drinkSize = ['one', 'two', 'bottle'][choices.indexOf(choice)]
  }

  addEntry(entry)
  callback(entry)
}

export const recordStomachAche = ({ callback } = {}) => async (_, { addChoice, addEntry, addMessage }) => {
  const entry = { time: Date.now() }
  {
    const question = hx`<span>${icon('frown')} How does your stomach feel?`
    const choice = await defer(callback => addChoice({ choices: stomachAdjectives, callback, question }))
    entry.stomach = stomachNouns[stomachAdjectives.indexOf(choice)]
  }
  {
    const question = hx`<span>${icon('frown')} How bad is it?`
    entry.severity = await defer(callback => addChoice({ choices: severities, callback, question }))
  }
  addMessage(hx`<p class=card> Okay, I've added ${entry.severity} ${entry.stomach} to the records. </p>`)
  addEntry(entry)
  callback(entry)
}

export const recordHeadache = ({callback} = {}) => async(_, {addChoice, addEntry, addMessage}) => {
  const entry = { time: Date.now() }
  {
    const question = hx`<span>${icon('frown')} How does your head feel?`
    const choice = await defer(callback => addChoice({ choices: headAdjectives, callback, question }))
    entry.head = headNouns[headAdjectives.indexOf(choice)]
  }
  {
    const question = hx`<span>${icon('frown')} How bad is it?`
    entry.severity = await defer(callback => addChoice({ choices: severities, callback, question }))
    addMessage(hx`<p class=card> Okay, I've added ${entry.severity} ${entry.head} to the records. </p>`)
  }
  addEntry(entry)
  callback(entry)
}

export const recordMeal = ({ question, callback } = {}) => async (_, { addChoice, addQuestion, addEntry }) => {
  const entry = {}
  {
    if (!question) question = hx`<span>${icon('clock')} When was your last meal?</span>`
    const choices = ['just now', 'an hour ago', 'three hours ago', 'six hours ago', 'yesterday']
    const choice = await defer(callback => addChoice({ question, choices, callback }))
    switch (choices.indexOf(choice)) {
      case 0: entry.time = Date.now(); break
      case 1: entry.time = Date.now() - (1 * HOURS); break
      case 2: entry.time = Date.now() - (3 * HOURS); break
      case 3: entry.time = Date.now() - (6 * HOURS); break
      case 4:
        const time = new Date()
        const choices = ['afternoon', 'evening', 'late night']
        const question = hx`<span>${icon('clock')} At what time did you eat last yesterday?`
        const choice = await defer(callback => addChoice({ question, choices, callback }))
        switch (choices.indexOf(choice)) {
          case 0: time.setHours(17); break
          case 1: time.setHours(19); break
          case 2: time.setHours(22); break
        }
        entry.time = time.getTime()
    }
  }
  {
    const question = hx`<span>${icon('utensils')} What did you have?</span>`
    const choices = ['a snack', 'a meal', 'a heavy meal']
    const choice = await defer(callback => addChoice({ choices, callback, question }))
    entry.foodSize = ['S', 'M', 'L'][choices.indexOf(choice)]
  }
  {
    const question = hx`<span>${icon('utensils')} Tell me the general type of the dish. Was it a stew or a pie or some curry, for example.</span>`
    const answer = await defer(callback => addQuestion({ question, callback }))
    entry.foodType = answer.split(/\s*,\s*/)
  }
  {
    const question = hx`<span>${icon('utensils')} Tell me the ingredients.</span>`
    const answer = await defer(callback => addQuestion({ question, callback }))
    entry.foodIngredients = answer.split(/\s*,\s*/)
  }
  {
    const question = hx`<span>${icon('wine-glass')} Did you have a drink as well? (other than water)`
    const answer = await defer(callback => addQuestion({ question, callback }))
    if (!['no', 'nein'].includes(answer)) entry.drink = answer.split(/\s*,\s*/)
  }
  if (entry.drink && entry.drink.length) {
    const question = hx`<span>${icon('wine-glass')} How many cups or glasses did you have?</span>`
    const choices = ['one', 'two', 'a bottle']
    const choice = await defer(callback => addChoice({ choices, callback, question }))
    entry.drinkSize = ['one', 'two', 'bottle'][choices.indexOf(choice)]
  }

  addMessage(hx`<p class=card> Okay, I've added ${entry.foodType.join(', ')} ${!entry.drink ? '' : ' and ' + entry.drink.join(', ')} to the records. </p>`)
  addEntry(entry)
  callback(entry)
}
