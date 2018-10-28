/* globals Notification, confirm, localStorage */
import { i, hx, randomId, defer, stomachAdjectives,
  stomachNouns, headAdjectives, headNouns, severities,
  urlBase64ToUint8Array } from './util.mjs'
import initialState from './state.mjs'

const SECONDS = 1000
const MINUTES = SECONDS * 60
const HOURS = MINUTES * 60

const messageSpeedMultiplier = 1200

const contact = 'contact the developer via https://github.com/lordvlad/food-diary/issues'

const { entries, assign } = Object
const immediate = true
const $ = (id) => document.getElementById(id)
const { clockOutline, silverware, fire, brain, foodApple, glassWine, 
  handPeace, gauge, cellphoneMessage, pencil } = i

const saveKeys = [
  'entries', 
  'messageSpeed', 
  'name', 
  'notificationSubscription'
]

let messageTimeout = null
let saveTimeout = null

export const scrollToBottom = () => window.scrollTo(0, document.body.scrollHeight)

export const diaryTab = (e) => { e && e.preventDefault(); return ({ diaryTab: true, assistantTab: false, optionsTab: false }) }
export const assistantTab = (e) => { e && e.preventDefault(); return ({ diaryTab: false, assistantTab: true, optionsTab: false }) }
export const optionsTab = (e) => { e && e.preventDefault(); return ({ diaryTab: false, assistantTab: false, optionsTab: true }) }

export const setMessageSpeed = messageSpeed => (_, { save }) => { save(); return { messageSpeed } }
export const setName = name => (_, { save }) => { save(); return { name } }
export const setNotificationSubscription = notificationSubscription => (_, { save }) => { save(); return { notificationSubscription } }

export const doSave = () => async (state) => {
  saveTimeout = null
  const copy = entries(state).reduce((o, [k, v]) => {
    if (saveKeys.includes(k)) o[k] = v
    return o
  }, {})
  localStorage.setItem('app', JSON.stringify(copy))
  console.log('saved state')
}
export const save = () => async (_, { doSave }) => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(doSave, 2000)
}

export const dequeueMessage = () => ({ messages, messageQueue, messageSpeed }, { dequeueMessage, scrollToBottom, assistantTab }) => {
  const message = messageQueue.shift()
  messageTimeout = null
  if (messageQueue.length) messageTimeout = setTimeout(dequeueMessage, messageSpeed * messageSpeedMultiplier)
  if (message.onCreated) setTimeout(message.onCreated, 10)
  setTimeout(scrollToBottom, 10)
  assistantTab()
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
  addMessage(assign(hx`<p class=card>Hello, ${name}!</p>`, { immediate }))
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
  const { checkNotifications, setUpNotifications, askForName, askForMessageSpeed, askForFirstMeal } = new Proxy({}, { get: (o, k) => () => defer(callback => actions[k]({ callback })) })
  if (!name) {
    addMessage(assign(hx`<h1 class="card is-text-center">Hello!`, { immediate }))
    addMessage(hx`<p class=card>Welcome to your personal food diary. ${handPeace}`)
    addMessage(hx`<p class=card>I will help you track everything you eat and drink. And I will track
              how that makes you feel.</p>`)
    addMessage(hx`<p class=card>Together, we will figure out your food intolerances.</p>`)

    await askForName()
    await askForMessageSpeed()
    await askForFirstMeal()
    addMessage(hx`<p class=card>Wasn't that hard, was it? Simply record your meals and your headaches and stomach troubles, and we'll figure this out together.`)
    await setUpNotifications()
  } else {
    addMessage(assign(hx`<h1 class="card is-text-center">Hello, ${name}!`, { immediate }))
    const notifications = await checkNotifications()
    if (notifications === 'obsolete') await setUpNotifications()
  }
  recordEntry()
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
  const question = hx`<span>${clockOutline} Now lets start tracking your meals. When was your last meal?</span>`
  recordMeal({ callback, question })
}

export const recordEntry = ({ callback } = {}) => async (_, actions) => {
  const { addChoice, recordSnack, recordMeal, recordDrink, recordStomachAche, recordHeadache } = actions
  const question = hx`<span>${pencil} What do you want to record?</span>`
  const choices = ['A meal', 'a snack', 'a drink', 'stomach ache', 'headache']
  const choice = await defer(callback => addChoice({ question, choices, callback }))
  const cb = (...args) => {
    if (callback) callback(...args) // eslint-disable-line 
    actions.recordEntry()
  }
  switch (choices.indexOf(choice)) {
    case 0: recordMeal({ callback: cb }); break
    case 1: recordSnack({ callback: cb }); break
    case 2: recordDrink({ callback: cb }); break
    case 3: recordStomachAche({ callback: cb }); break
    case 4: recordHeadache({ callback: cb }); break
  }
}

export const recordDrink = ({ callback } = {}) => async (_, { recordTime, addMessage, addQuestion, addChoice, addEntry }) => {
  const entry = {}
  {
    const question = hx`<span>${clockOutline} When did you have it?</span>`
    entry.time = await defer(callback => recordTime({ callback, question }))
  }
  {
    const question = hx`<span>${glassWine} What did you drink? (other than water)`
    const answer = await defer(callback => addQuestion({ question, callback }))
    entry.drink = answer.split(/\s*,\s*/)
  }
  const question = hx`<span>${glassWine} How many cups or glasses did you have?</span>`
  const choices = ['one', 'two', 'a bottle']
  const choice = await defer(callback => addChoice({ choices, callback, question }))
  entry.drinkSize = ['one', 'two', 'bottle'][choices.indexOf(choice)]
  addMessage(hx`<p class=card> Okay, I've added ${entry.drink.join(', ')} to the records. </p>`)

  addEntry(entry)
  callback(entry)
}

export const recordStomachAche = ({ callback } = {}) => async (_, { addChoice, addEntry, addMessage }) => {
  const entry = { time: Date.now() }
  {
    const question = hx`<span>${fire} How does your stomach feel?`
    const choice = await defer(callback => addChoice({ choices: stomachAdjectives, callback, question }))
    entry.stomach = stomachNouns[stomachAdjectives.indexOf(choice)]
  }
  {
    const question = hx`<span>${gauge} How bad is it?`
    entry.severity = await defer(callback => addChoice({ choices: severities, callback, question }))
  }
  addMessage(hx`<p class=card> Okay, I've added ${entry.severity} ${entry.stomach} to the records. </p>`)
  addEntry(entry)
  callback(entry)
}

export const recordHeadache = ({callback} = {}) => async(_, {addChoice, addEntry, addMessage}) => {
  const entry = { time: Date.now() }
  {
    const question = hx`<span>${brain} How does your head feel?`
    const choice = await defer(callback => addChoice({ choices: headAdjectives, callback, question }))
    entry.head = headNouns[headAdjectives.indexOf(choice)]
  }
  {
    const question = hx`<span>${gauge} How bad is it?`
    entry.severity = await defer(callback => addChoice({ choices: severities, callback, question }))
    addMessage(hx`<p class=card> Okay, I've added ${entry.severity} ${entry.head} to the records. </p>`)
  }
  addEntry(entry)
  callback(entry)
}

export const recordSnack = ({ callback } = {}) => async (_, { addMessage, addQuestion, addEntry, recordTime }) => {
  const question = hx`<span>${clockOutline} When did you have it?</span>`
  const time = await defer(callback => recordTime({ callback, question }))
  const question2 = hx`<span>${foodApple} What snack did you have?</span>`
  const answer = await defer(callback => addQuestion({ question: question2, callback }))
  const snack = answer.split(/\s*,\s*/)
  const entry = {snack, time}
  addMessage(hx`<p class=card> Okay, I've added ${entry.snack.join(', ')} to the records. </p>`)
  addEntry(entry)
  callback(entry)
}

export const recordTime = ({question, callback} = {}) => async(_, {addChoice}) => {
  const choices = ['just now', 'an hour ago', 'three hours ago', 'six hours ago', 'yesterday']
  const choice = await defer(callback => addChoice({ question, choices, callback }))
  let time = 0
  switch (choices.indexOf(choice)) {
    case 0: time = Date.now(); break
    case 1: time = Date.now() - (1 * HOURS); break
    case 2: time = Date.now() - (3 * HOURS); break
    case 3: time = Date.now() - (6 * HOURS); break
    case 4:
      time = new Date()
      const choices = ['afternoon', 'evening', 'late night']
      const question = hx`<span>${clockOutline} At what time did you eat last yesterday?`
      const choice = await defer(callback => addChoice({ question, choices, callback }))
      switch (choices.indexOf(choice)) {
        case 0: time.setHours(17); break
        case 1: time.setHours(19); break
        case 2: time.setHours(22); break
      }
  }
  callback(time)
}

export const recordMeal = ({ question, callback } = {}) => async (_, { recordTime, addChoice, addQuestion, addEntry, addMessage }) => {
  const entry = {}
  if (!question) question = hx`<span>${clockOutline} When was your last meal?</span>`
  entry.time = await defer(callback => recordTime({ callback, question }))
  {
    const question = hx`<span>${silverware} Tell me the general type of the dish. Was it a stew or a pie or some curry, for example.</span>`
    const answer = await defer(callback => addQuestion({ question, callback }))
    entry.foodType = answer.split(/\s*,\s*/)
  }
  {
    const question = hx`<span>${silverware} Tell me the ingredients.</span>`
    const answer = await defer(callback => addQuestion({ question, callback }))
    entry.foodIngredients = answer.split(/\s*,\s*/)
  }
  {
    const question = hx`<span>${glassWine} Did you have a drink as well? (other than water)`
    const answer = await defer(callback => addQuestion({ question, callback }))
    if (!['no', 'nein', 'No', 'Nein'].includes(answer)) entry.drink = answer.split(/\s*,\s*/)
  }
  if (entry.drink && entry.drink.length) {
    const question = hx`<span>${glassWine} How many cups or glasses did you have?</span>`
    const choices = ['one', 'two', 'a bottle']
    const choice = await defer(callback => addChoice({ choices, callback, question }))
    entry.drinkSize = ['one', 'two', 'bottle'][choices.indexOf(choice)]
  }

  addMessage(hx`<p class=card> Okay, I've added ${entry.foodType.join(', ')} ${!entry.drink ? '' : ' and ' + entry.drink.join(', ')} to the records. </p>`)
  addEntry(entry)
  callback(entry)
}

export const resetUserData = ({ callback } = {}) => async (_, { addChoice, disableNotifications }) => {
  const question = 'Do you really want to reset all user data? You will not be able to undo this operation.'
  const choices = ['No, keep my data', 'Yes, reset all user data']
  const choice = await defer(callback => addChoice({choices, question, callback}))
  if (choice === choices[0]) {
    addMessage(hx`<p class=card>Phew, crisis averted!</p>`)
    return callback && callback()
  }

  await defer(callback => disableNotifications({ callback }))
  localStorage.clear()
  actions.loadStateFromLocalStorage() 
  location.reload()
}

export const loadStateFromLocalStorage = () => {
  const str = localStorage.getItem('app')
  return str ? JSON.parse(str) : initialState
}

export const disableNotifications = ({ callback } = {}) => async ({ notificationSubscription }, { setNotificationSubscription, recordEntry, addMessage }) => {
  if (!callback) callback = recordEntry
  if (!notificationSubscription) { 
    addMessage(hx`<p class=card>${cellphoneMessage} Notifications are not set up, nothing to disable.</p>`)
    return callback(true)
  }
  const body = JSON.stringify(notificationSubscription)
  const response = await fetch('/unsubscribe', { method: 'POST', body }) 
  if (response.ok) {
    addMessage(hx`<p class=card>${cellphoneMessage} Successfully disabled notifications.</p>`)
    setNotificationSubscription(null)
    return callback(true)
  } 
  addMessage(hx`<p class=card>${cellphoneMessage} Notifications failed to be disabled. Please try again in a little while or ${contact}.</p>`) 
  callback(false)
}

export const checkNotifications = ({ callback } = {}) => async ({ notificationSubscription }, { recordEntry }) => {
  if (!callback) callback = recordEntry
  if (!notificationSubscription) return callback('none')
  const body = JSON.stringify(notificationSubscription)
  const response = await fetch('/checkSubscription', { method: 'POST', body }) 
  callback(response.ok ? 'ok' : 'obsolete')
}

export const setUpNotifications = ({ callback } = {}) => async (_, { setNotificationSubscription, addMessage, addChoice, recordEntry }) => {
  if (!callback) callback = recordEntry
  if (Notification.permission !== 'granted') {
    const bail = () => {
      addMessage(hx`That's okay if you don't want notifications, but keep in mind that you'll 
        need to track your meals regularly to find patterns. You can set up notifications via
        diary > options if you change your mind.`)
      setNotificationSubscription(null)
      return callback() 
    }
    const question = hx`<span>${cellphoneMessage} Food diary can remind you to track your meals. You can always change
      your preference in the settings, should you change your mind. Do you want to set up notifications now?</span>`
    const choices = ['yes, please', 'no, I don\'t want notifications']
    const choice = await defer(callback => addChoice({ choices, callback, question }))
    if (choice === choices[1]) return bail()
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return bail()
  }
  const registration = await navigator.serviceWorker.ready
  const publicKey = await (await fetch('/publicKey')).text()
  const appServerKey = urlBase64ToUint8Array(publicKey)
  const subscription = await registration.pushManager.subscribe({ appServerKey, userVisibleOnly: true })
  const body = JSON.stringify(subscription)
  const response = await fetch('/subscribe', { method: 'POST', body })
  if (response.ok) {
    setNotificationSubscription(subscription)
    addMessage(hx`<p class=card>${cellphoneMessage} Notifications sucessfully set up.`)
  } else {
    setNotificationSubscription(null)
    addMessage(hx`<p class=card>${cellphoneMessage} Notifications were not set up successfully. Try again in a little while or ${contact}.`)
    console.error(`${response.status} ${response.statusText}`)
  }
  callback()
}

export const onLoad = () => async () => {
  navigator.serviceWorker.register('/sw.js', { scope: '/', type: 'module' })
}

export const run = () => async (_, actions) => {
  const { onLoad, welcome, loadStateFromLocalStorage } = actions
  window.actions = actions // FIXME debug code
  window.addEventListener('load', () => onLoad())
  loadStateFromLocalStorage()
  welcome()
}

// FIXME debug code
export const exposeState = () => async (state, _) => {
  console.log(window.state = state)
}