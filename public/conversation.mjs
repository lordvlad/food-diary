import { i, defer, immediate, autobind } from './util.mjs'

import { events as assistantEvents } from './assistant.mjs'
import { events as optionEvents } from './options.mjs'
import { events as diaryEvents } from './diary.mjs'

const { addMessage } = assistantEvents
const { addEntry, askForMeal, askForRecord } = diaryEvents
const { askForNotifications, checkSubscription, setSetupComplete, setName, loadComplete } = optionEvents

const welcome = 'welcome'
const askForName = 'askForName'
const askForFirstMeal = 'askForFirstMeal'

export const events = { welcome, askForName, askForFirstMeal }

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)

  on(loadComplete, _ => emit(welcome))

  on(welcome, async () => {
    const { name } = (state.options || {})
    const resolve = () => emit(askForRecord)
    if (name) {
      emit(checkSubscription)
      emit(addMessage, { immediate, title: `Hello, ${name}!`, resolve })
    } else {
      emit(addMessage, { title: 'Hello!' })
      emit(addMessage, { icon: i.handPeace, message: `Welcome to your personal food diary.` })
      emit(addMessage, { message: `I will help you track everthing you eat and drink. 
        And I will track how that makes you feel.` })
      emit(addMessage, { message: `Together, we will figure out your food intolerances.` })
      const name = await defer(resolve => emit(askForName, { resolve }))
      emit(setName, name)
      const entry = await defer(resolve => emit(askForFirstMeal, { resolve }))
      emit(addEntry, entry)
      emit(addMessage, { message: `Wasn't that hard, was it? Simply record your meals and 
        your headaches and stomach troubles, and we'll figure this out together.` })
      await defer(resolve => emit(askForNotifications, { resolve }))
      emit(addMessage, { message: `And worry not about your privacy, all your records stay
        on your device.` })
      emit(addMessage, {
        message: `You will find all your records in the <b>diary</b> tab.
        As well as options to configure your food diary.`,
        resolve: () => {
          emit(setSetupComplete, true)
          resolve()
        }
      })
    }
  })

  on(askForFirstMeal, async ({ resolve }) => {
    const question = `Now lets start tracking your meals. When was your last meal?`
    emit(askForMeal, { question, resolve })
  })

  on(askForName, async ({ resolve }) => {
    const question = 'But first, I\'ll need your name. How should I call you?'
    const name = await defer(resolve => emit(addMessage, { question, resolve }))
    await defer(resolve => emit(addMessage, { immediate, message: `Hello, ${name}!`, resolve }))
    resolve(name)
  })
}
