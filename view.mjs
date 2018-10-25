import { drinkSizes, foodSizes, hx, i } from './util.mjs'
import fromNow from 'https://unpkg.com/fromnow@3.0.0/dist/fromnow.mjs'

const active = 'active'
const hidden = 'is-hidden'

export default (state, actions) => hx`
<div class=app>
  <div class="${state.assistantTab || hidden} container">
    ${state.messages}
  </div>
  <div class="${state.optionsTab || hidden} container">
    <h4><span>\u00A0</span><span class=pull-right>options</span></h4>
    <p class=card>
      <p>Your Name</p>
      <input type=text value=${state.name || ''}
        placeholder="Jane Doe"
        onblur=${e => actions.setName(e.target.value)}
        onkeyup=${e => { if (e.keyCode !== 13) return; e.preventDefault(); actions.setName(e.target.value) }}>
    </p>
    <p class=card>
      <p>Message Speed</p>
      <p>
        <button
          onclick=${() => actions.setMessageSpeed(0.6)}
          class="button primary ${state.messageSpeed === 0.6 || 'outline'}">
          fast
        </button>
        <button
          onclick=${() => actions.setMessageSpeed(1.0)}
          class="button primary ${state.messageSpeed === 1.0 || 'outline'}">
          medium
        </button>
        <button
          onclick=${() => actions.setMessageSpeed(1.4)}
          class="button primary ${state.messageSpeed === 1.4 || 'outline'}">
          slow
        </button>
      </p>
    </p>
    <p class=card>
      <p>Reset all user data</p>
      <p>
        <button onclick=${() => actions.resetUserData()} class="button error">reset</button>
      </p>
    </p>
    <p>
      <a target=_new href="https://github.com/lordvlad/food-diary">about food-diary</a>
    </p>
  </div>
  <div class="${state.diaryTab || hidden} container">
    <h4>
      <span>${state.entries.length} entries</span>
      <span class=pull-right>
        <a href=# onclick=${actions.optionsTab} class=${state.optionsTab && active}>options</a>
      </span>
    </h4>
    ${state.entries.length ? state.entries.map(e => hx`<p class=card>
      <p>
        <b>${i.clockOutline} ${fromNow(new Date(e.time).toString())} ago</b>
      </p>
      ${!e.foodType ? '' : hx`
        <p>
          ${i.silverware}
          ${e.foodType.join(', ')}
          <span class=text-grey>(${e.foodIngredients.join(', ')})</span>
        </p> 
      `}
      ${!e.snack ? '' : hx`
        <p>
          ${i.foodApple}
          ${e.snack.join(', ')}
        </p>
      `}
      ${!e.drink ? '' : hx`
        <p> 
          ${i.glassWine}
          ${drinkSizes[e.drinkSize]} of
          ${e.drink.join(', ')} 
        </p>
      `}
      ${!e.stomach ? '' : hx`
        <p> ${i.fire} ${e.severity} ${e.stomach} </p>
      `}
      ${!e.head ? '' : hx`
        <p> ${i.brain} ${e.severity} ${e.head} </p>
      `}
    </p>`) : hx`
      <div class=card>
        <h4 class=is-text-center>No entries ${i.cardsOutline}</h4>
        <p class=is-text-center>
          switch over to the assistant to enter some records
        </p>
      </div>
    `}
  </div>
  <div class=nav>
    <div class=nav-center>
      <div class=tabs>
        <a href=# onclick=${actions.assistantTab} class=${state.assistantTab && active}>assistant</a>
        <a href=# onclick=${actions.diaryTab} class=${state.diaryTab && active}>my diary</a>
      </div>
    </div>
  </div>
</div>
`
