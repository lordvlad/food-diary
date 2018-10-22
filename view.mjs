import { drinkSizes, foodSizes, hx, icon } from './util.mjs'
import fromNow from 'https://unpkg.com/fromnow@3.0.0/dist/fromnow.mjs'

const active = 'active'
const hidden = 'is-hidden'

export default (state, actions) => hx`
<div class=app>
  <div class="${state.assistantTab || hidden} container">
    ${state.messages}
  </div>
  <div class="${state.optionsTab || hidden} container">
    <p class=card>
      <p>
        <label for=name>Your Name</label>
        <input type=text value=${state.name || ''}
          placeholder="Jane Doe"
          onblur=${e => actions.setName(e.target.value)}
          onkeyup=${e => { if (e.keyCode !== 13) return; e.preventDefault(); actions.setName(e.target.value) }}>
      </p>
      <p>
        <label for=messageSpeed>Message Speed</label>
        <p>
          <button
            onclick=${(e) => actions.setMessageSpeed(0.6)}
            class="button primary ${state.messageSpeed === 0.6 || 'outline'}">
            fast
          </button>
          <button
            onclick=${(e) => actions.setMessageSpeed(1.0)}
            class="button primary ${state.messageSpeed === 1.0 || 'outline'}">
            medium
          </button>
          <button
            onclick=${(e) => actions.setMessageSpeed(1.4)}
            class="button primary ${state.messageSpeed === 1.4 || 'outline'}">
            slow
          </button>
        </p>
      </p>
    </p>
  </div>
  <div class="${state.diaryTab || hidden} container">
    <h4>${state.entries.length} entries</h4>
    ${state.entries.map(e => hx`<p class=card>
      <p>
        <b>${icon('clock')} ${fromNow(new Date(e.time).toString())} ago</b>
      </p>
      ${!e.foodType ? '' : hx`
        <p>
          ${icon('utensils')}
          <b>${foodSizes[e.foodSize]}</b>
          ${e.foodType.join(', ')}
          <span class=text-grey>(${e.foodIngredients.join(', ')})</span>
        </p> 
      `}
      ${!e.drink ? '' : hx`
        <p> 
          ${icon('wine-glass')}
          ${drinkSizes[e.drinkSize]}
          ${e.drink.join(', ')} 
        </p>
      `}
      ${!e.stomach ? '' : hx`
        <p> ${icon('frown')} ${e.severity} ${e.stomach} </p>
      `}
      ${!e.head ? '' : hx`
        <p> ${icon('frown')} ${e.severity} ${e.head} </p>
      `}
    </p>`)}
  </div>
  <div class=nav>
    <div class=nav-left></div>
    <div class=nav-center>
      <div class=tabs>
        <a href=# onclick=${actions.diaryTab} class=${state.diaryTab && active}>diary</a>
        <a href=# onclick=${actions.assistantTab} class=${state.assistantTab && active}>assistant</a>
        <a href=# onclick=${actions.optionsTab} class=${state.optionsTab && active}>options</a>
      </div>
    </div>
    <div class=nav-right><div class=status>
      <a><i class="fa fa-fw ${state.saveIcon ? 'fa-save' : ''}"></i></a>
    </div></div>
  </div>
</div>
`
