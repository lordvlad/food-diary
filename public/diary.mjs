import fromNow from 'https://unpkg.com/fromnow@3.0.0/dist/fromnow.mjs'
import { stomachAdjectives, stomachNouns, headNouns, headAdjectives,
  severities, render, defer, autobind, hidden, html, i, drinkSizes } from './util.mjs'
import { events as idbEvents } from './idb.mjs'
import { events as assistantEvents } from './assistant.mjs'

const SECONDS = 1000
const MINUTES = SECONDS * 60
const HOURS = MINUTES * 60
const { addMessage } = assistantEvents
const { save } = idbEvents
const { assign } = Object

const askForTime = 'askForTime'
const addEntry = 'addEntry'
const recordEntry = 'recordEntry'
const askForMeal = 'askForMeal'
const askForRecord = 'askForRecord'
const askForSnack = 'askForSnack'
const askForDrink = 'askForDrink'
const askForStomachAche = 'askForStomachAche'
const askForHeadache = 'askForHeadache'

export const events = { addEntry, askForMeal, askForRecord }

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const entries = []
  assign(state, { entries })

  on(addEntry, e => {
    entries.unshift(e)
    emit(save)
    emit(recordEntry)
    emit(render)
  })

  on(askForHeadache, async ({ resolve }) => {
    const entry = { time: Date.now() }
    {
      const icon = i.brain
      const question = 'How does your head feel?'
      const choice = await defer(resolve => emit(addMessage, { icon, choices: headAdjectives, resolve, question }))
      entry.head = headNouns[headAdjectives.indexOf(choice)]
    }
    {
      const icon = i.gauge
      const question = 'How bad is it?'
      entry.severity = await defer(resolve => emit(addMessage, { choices: severities, resolve, icon, question }))
    }
    resolve(entry)
  })

  on(askForStomachAche, async ({ resolve }) => {
    const entry = { time: Date.now() }
    {
      const icon = i.fire
      const question = 'How does your stomach feel?'
      const choice = await defer(resolve => emit(addMessage, { icon, choices: stomachAdjectives, resolve, question }))
      entry.stomach = stomachNouns[stomachAdjectives.indexOf(choice)]
    }
    {
      const icon = i.gauge
      const question = 'How bad is it?'
      entry.severity = await defer(resolve => emit(addMessage, { choices: severities, resolve, icon, question }))
    }
    resolve(entry)
  })

  on(askForRecord, async ({ resolve } = {}) => {
    const originalResolve = resolve || (() => emit(askForRecord))
    const icon = i.pencil
    const question = `What do you want to record?`
    const choices = ['A meal', 'a snack', 'a drink', 'stomach ache', 'headache']
    const choice = await defer(resolve => emit(addMessage, { question, choices, icon, resolve }))
    {
      const resolve = entry => { emit(addEntry, entry); originalResolve(entry) }
      switch (choices.indexOf(choice)) {
        case 0: emit(askForMeal, { resolve }); break
        case 1: emit(askForSnack, { resolve }); break
        case 2: emit(askForDrink, { resolve }); break
        case 3: emit(askForStomachAche, { resolve }); break
        case 4: emit(askForHeadache, { resolve }); break
      }
    }
  })

  on(askForDrink, async ({ resolve }) => {
    const entry = {}
    {
      const question = 'When did you have the drink?'
      entry.time = await defer(resolve => emit(askForTime, { question, resolve }))
    }
    {
      const icon = i.glassWine
      const question = 'What drink did you have?'
      const drink = await defer(resolve => emit(addMessage, { question, icon, resolve }))
      entry.drink = drink.split(/\s*,\s*/)
    }
    {
      const icon = i.glassWine
      const question = 'How many cups or glasses did you have?'
      const choices = ['one', 'two', 'a bottle']
      const choice = await defer(resolve => emit(addMessage, { choices, resolve, question, icon }))
      entry.drinkSize = ['one', 'two', 'bottle'][choices.indexOf(choice)]
    }
    resolve(entry)
  })

  on(askForSnack, async ({ resolve }) => {
    const entry = {}
    {
      const question = 'When did you have the snack?'
      entry.time = await defer(resolve => emit(askForTime, { question, resolve }))
    }
    {
      const icon = i.foodApple
      const question = 'What snack did you have?'
      const snack = await defer(resolve => emit(addMessage, { question, icon, resolve }))
      entry.snack = snack.split(/\s*,\s*/)
    }
    resolve(entry)
  })

  on(askForTime, async ({ question, resolve }) => {
    const choices = ['just now', 'an hour ago', 'three hours ago', 'six hours ago']
    const past18oClock = new Date().getHours() > 18
    choices.push(past18oClock ? '10 hours ago' : 'yesterday')
    const choice = await defer(resolve => emit(addMessage, { question, choices, resolve, icon: i.clockOutline }))
    let time = 0
    switch (choices.indexOf(choice)) {
      case 0: time = Date.now(); break
      case 1: time = Date.now() - (1 * HOURS); break
      case 2: time = Date.now() - (3 * HOURS); break
      case 3: time = Date.now() - (6 * HOURS); break
      case 4:
        if (past18oClock) { time = Date.now() - (10 * HOURS); break }
        time = new Date()
        const choices = ['afternoon', 'evening', 'late night']
        const question = `At what time did you eat last yesterday?`
        const choice = await defer(resolve => emit(addMessage, { question, choices, resolve, icon: i.clockOutline }))
        switch (choices.indexOf(choice)) {
          case 0: time.setHours(17); break
          case 1: time.setHours(19); break
          case 2: time.setHours(22); break
        }
        time.getTime()
        break
    }
    resolve(time)
  })

  on(askForMeal, async ({ question, resolve }) => {
    const entry = {}
    if (!question) question = 'When was your last meal'
    entry.time = await defer(resolve => emit(askForTime, { question, resolve }))
    {
      const icon = i.silverware
      const question = `Tell me the general type of the dish. Was it a 
      stew or a pie or some curry, for example.`
      const answer = await defer(resolve => emit(addMessage, { icon, question, resolve }))
      entry.foodType = answer.split(/\s*,\s*/)
    }
    {
      const icon = i.silverware
      const question = `Tell me the ingredients.`
      const answer = await defer(resolve => emit(addMessage, { icon, question, resolve }))
      entry.ingredients = answer.split(/\s*,\s*/)
    }
    {
      const icon = i.glassWine
      const question = `Did you have a drink as well? (other than water)`
      const answer = await defer(resolve => emit(addMessage, { icon, question, resolve }))
      if (!['no', 'nein', 'No', 'Nein', ''].includes(answer)) entry.drink = answer.split(/\s*,\s*/)
    }
    if (entry.drink) {
      const icon = i.glassWine
      const question = `How many cups or glasses did you have?`
      const choices = ['one', 'two', 'a bottle']
      const choice = await defer(resolve => emit(addMessage, { choices, resolve, question, icon }))
      entry.drinkSize = ['one', 'two', 'bottle'][choices.indexOf(choice)]
    }
    resolve(entry)
  })
}

export const view = (state, emit) => html`
  <div class="${state.tabs.diary || hidden} container">
    <h4>
      <span>${state.entries.length} entries</span>
      <span class=pull-right>
        <a href=# onclick=${() => emit('tab', 'options')}>options</a>
      </span>
    </h4>
    ${state.entries.length ? state.entries.map(e => html`<p class=card>
      <p>
        <b>${i.clockOutline()} ${fromNow(new Date(e.time).toString())} ago</b>
      </p>
      ${!e.foodType ? '' : html`
        <p>
          ${i.silverware()} ${e.foodType.join(', ')}
          <span class=text-grey> (${(e.ingredients || []).join(', ')})</span>
        </p> 
      `}
      ${!e.snack ? '' : html`
        <p>
          ${i.foodApple()} ${e.snack.join(', ')}
        </p>
      `}
      ${!e.drink ? '' : html`
        <p> 
          ${i.glassWine()} ${drinkSizes[e.drinkSize]} of ${e.drink.join(', ')} 
        </p>
      `}
      ${!e.stomach ? '' : html`<p> ${i.fire()} ${e.severity} ${e.stomach} </p>`}
      ${!e.head ? '' : html`<p> ${i.brain()} ${e.severity} ${e.head} </p>`}
    </p>`) : html`
      <div class=card>
        <h4 class=is-text-center>No entries ${i.cardsOutline()}</h4>
        <p class=is-text-center>
          switch over to the assistant to enter some records
        </p>
      </div>
    `}
  </div>
`
