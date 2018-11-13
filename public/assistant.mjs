import { raw, render, $, randomId, autobind, hidden, html, debounce } from './util.mjs'

const { assign } = Object

const addMessage = 'addMessage'
const dequeueMessage = 'dequeueMessage'
const scrollToBottom = 'scrollToBottom'
const dequeueMessageImmediately = 'dequeueMessageImmediately'

export const events = { addMessage }

export const view = state => {
  const toIcon = icon => !icon ? '' : icon.nodeName ? icon : icon.call ? icon() : `[ICON ${icon}]`
  const questionCard = m => {
    // FIXME enable suggestions
    // const { disabled, icon, resolve, question, value, suggestion } = m
    const { disabled, icon, resolve, question, value } = m
    const suggestion = null
    const id = (m.id || (m.id = randomId()))
    const focus = () => $(id).focus()
    const blur = () => $(id).blur()
    const keydown = e => { if (e.keyCode === 13) enter(e) }
    const input = html`<input ${disabled ? 'readonly' : ''} 
      value=${value || (suggestion && suggestion.join(', ')) || ''} id=${id} type=text onkeydown=${keydown}>`
    const enter = e => {
      e.preventDefault()
      m.disabled = true
      setTimeout(blur, 100)
      resolve(m.value = e.target.value)
    }
    if (!disabled) setTimeout(focus, 100)
    return html`<p class=card>${toIcon(icon)} ${raw(question)} ${input}</p>`
  }

  const titleCard = m => {
    const { resolve, icon, title } = m
    if (resolve) { setTimeout(resolve, 100); m.resolve = null }
    return html`<h1 class="is-text-center card">${toIcon(icon)} ${raw(title)}</h1>`
  }

  const messageCard = m => {
    const { resolve, icon, message } = m
    if (resolve) { setTimeout(resolve, 100); m.resolve = null }
    return html`<p class=card>${toIcon(icon)} ${raw(message)}</p>`
  }

  const choiceCard = m => {
    const { resolve, icon, question, choice, choices, disabled } = m
    const id = (m.id || (m.id = randomId()))
    const click = answer => () => {
      m.disabled = true
      m.choice = answer
      $(`${id}-${choices.indexOf(answer)}`).classList.remove('outline')
      resolve(answer)
    }

    const buttons = choices.map((answer, i) => html`
      <button class="button primary ${choice === answer ? '' : 'outline'}" 
        id="${id}-${i}" ${disabled ? 'disabled' : ''}
        onclick=${click(answer)}> ${answer} </button>`)

    return html`<p class=card><p>${toIcon(icon)} ${raw(question)}</p><p>${buttons}</p></p>`
  }

  const card = m => {
    if (m.choices) return choiceCard(m)
    if (m.question) return questionCard(m)
    if (m.title) return titleCard(m)
    return messageCard(m)
  }

  return html`
    <div class="${state.tabs.assistant || hidden} container">
      ${state.messages.map(card)}
    </div>
  `
}

export const store = (state, emitter) => {
  const { on, emit } = autobind(emitter)
  const messages = []
  const messageQueue = []

  assign(state, { messages, messageQueue })

  on(addMessage, msg => {
    messageQueue.push(msg)
    emit(msg.immediate ? dequeueMessageImmediately : dequeueMessage)
  })

  on(dequeueMessageImmediately, () => {
    if (!messageQueue.length) return
    const msg = messageQueue.shift()
    messages.push(msg)
    emit(render)
    emit('tab', 'assistant')
    emit(scrollToBottom)
    if (messageQueue.length) emit(dequeueMessage)
  })

  on('tab', active => { if (state.tabs.assistant) emit(scrollToBottom) })
  on(dequeueMessage, debounce(1000, () => emit(dequeueMessageImmediately)))
  on(scrollToBottom, debounce(10, () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })))
  window.onresize = () => { if (state.tabs.assistant) emit(scrollToBottom) }
}
