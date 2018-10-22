/* globals localStorage */
const { assign } = Object
const initialState = {
  messageSpeed: 1,
  entries: [],
  messages: [ ],
  messageQueue: [],
  name: null,
  diaryTab: false,
  assistantTab: true,
  optionsTab: false
}

const stateJson = localStorage.getItem('app')
const state = stateJson ? assign(JSON.parse(stateJson), {
  messages: [],
  diaryTab: false,
  assistantTab: true,
  optionsTab: false
}) : initialState

export default state
