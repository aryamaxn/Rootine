import { currentStreak, longestStreak, completionRate, recentDays, weekDates } from './streaks.js';
import { plantSVG } from './plants.js';
const $ = selector => document.querySelector(selector);
const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const emojis = ['🌱','💧','📖','🧘','🏃','🥗','💤','📝','☀️','🪴','🎨','🎸','🧹','🫖','🚶','💊','🧴','🧠','💌','🍎','🧘‍♀️','🧑‍🍳','📵','🌸'];
const colors = ['sage','moss','sky','lavender','peach','butter'];
export const ui = {
  render(state) {
    this.renderHeader(state); this.renderProgress(state); this.renderGarden(state); this.renderCelebration(state);
  },
  renderHeader(state) {
    const hour = new Date().getHours();
    $('#greeting').textContent = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'} 🌱`;
    $('#header-date').textContent = new Intl.DateTimeFormat(undefined, { weekday:'long', month:'long', day:'numeric', year:'numeric' }).format(new Date());
  },
  renderProgress(state) {
    const done = state.habits.filter(h => h.completedDates.includes(state.today)).length;
    $('#progress-count').textContent = `${done} of ${state.habits.length}`;
    $('#progress-ring').style.setProperty('--progress', `${state.habits.length ? done / state.habits.length * 360 : 0}deg`);
    $('#garden-caption').textContent = state.habits.length ? `${done === state.habits.length ? 'Your garden is glowing today.' : 'A little care goes a long way.'}` : 'A little care goes a long way.';
  },
  renderCelebration(state) {
    $('#celebration').classList.toggle('hidden', !state.habits.length || !state.habits.every(h => h.completedDates.includes(state.today)));
  },
  renderGarden(state) {
    const garden = $('#garden');
    if (state.loading) { garden.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>'; return; }
    if (state.error) { garden.innerHTML = `<div class="error-state"><div class="empty-art">🌦️</div><h3>Your garden is taking a pause</h3><p>${escapeHTML(state.error)}</p><button class="button button-primary" data-action="retry">Try again</button></div>`; return; }
    if (!state.habits.length) { garden.innerHTML = '<div class="empty-state"><div class="empty-art" aria-hidden="true">🪴</div><h3>There’s room for something lovely</h3><p>Plant a habit you’d like to tend, one small day at a time.</p><button class="button button-primary" data-action="add">Plant your first habit</button></div>'; return; }
    let visible = state.habits;
    if (state.filter === 'done') visible = visible.filter(h => h.completedDates.includes(state.today));
    if (state.filter === 'pending') visible = visible.filter(h => !h.completedDates.includes(state.today));
    if (!visible.length) { garden.innerHTML = '<div class="no-results">Nothing here just yet. Your garden is growing at its own pace.</div>'; return; }
    garden.innerHTML = visible.map(h => cardHTML(h, state.today)).join('');
  },
  openHabitModal(habit = null) {
    const editing = Boolean(habit);
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${editing ? 'Tend a habit' : 'Plant a new habit'}</h2><p class="modal-intro">Choose something small that feels good to grow.</p><form id="habit-form" novalidate><label class="field-label" for="habit-name">Habit name</label><input class="habit-input" id="habit-name" name="name" maxlength="40" autocomplete="off" placeholder="e.g. Read for ten minutes" value="${escapeHTML(habit?.name || '')}" required><div class="field-error" id="name-error" aria-live="polite"></div><span class="field-label">Pick a little symbol</span><div class="emoji-grid" role="group" aria-label="Choose an emoji">${emojis.map(e => `<button type="button" class="emoji-choice" data-emoji="${e}" aria-label="${e}" aria-pressed="${e === (habit?.emoji || '🌱')}">${e}</button>`).join('')}</div><span class="field-label">Garden tone</span><div class="color-row" role="group" aria-label="Choose a color">${colors.map(c => `<button type="button" class="color-choice" data-color="${c}" aria-label="${c}" aria-pressed="${c === (habit?.color || 'sage')}"></button>`).join('')}</div><div class="modal-actions"><button type="button" class="button button-quiet" data-action="cancel">Cancel</button><button class="button button-primary" type="submit">${editing ? 'Save changes' : 'Plant habit'}</button></div></form></section></div>`;
    const focusable = () => [...root.querySelectorAll('button,input')].filter(el => !el.disabled);
    root.querySelector('#habit-name').focus();
    root.querySelector('[data-backdrop]').addEventListener('click', e => { if (e.target === e.currentTarget) this.closeModal(); });
    root.querySelector('.modal').addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeModal();
      if (e.key === 'Tab') { const list = focusable(); const first=list[0], last=list.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
  },
  closeModal() { $('#modal-root').innerHTML = ''; },
  confirmDelete(habit) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Let this habit go?</h2><p class="modal-intro">“${escapeHTML(habit.name)}” and its garden history will be removed.</p><div class="dialog-actions"><button class="button button-quiet" data-action="cancel">Keep habit</button><button class="button button-primary" data-action="confirm-delete">Remove habit</button></div></section></div>`;
    root.querySelector('[data-action="cancel"]').focus();
    root.querySelector('[data-backdrop]').addEventListener('click', e => { if(e.target === e.currentTarget)this.closeModal(); });
    root.querySelector('.modal').addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeModal();
      if (e.key === 'Tab') {
        const controls = [...root.querySelectorAll('button')];
        if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); }
      }
    });
  },
  toast(message, error = false) { const root=$('#toast-root'); root.innerHTML=`<div class="toast ${error?'error':''}" role="status">${escapeHTML(message)}</div>`; window.setTimeout(()=>{root.innerHTML='';},3000); },
  renderTheme(theme) { document.documentElement.dataset.theme=theme; $('#theme-toggle').textContent=theme==='dark'?'☀':'☾'; $('#theme-toggle').setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme'); }
};
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
const growth = [
  { threshold: 0, label: 'A little seed' },
  { threshold: 1, label: 'A new sprout' },
  { threshold: 3, label: 'Finding its roots' },
  { threshold: 7, label: 'Growing leafy' },
  { threshold: 14, label: 'In full bloom' }
];
function stageFor(count) { return growth.reduce((stage, step, index) => count >= step.threshold ? index : stage, 0); }
function cardHTML(h, today) {
  const stage=stageFor(h.completedDates.length), week=weekDates(today), todayDone=h.completedDates.includes(today), days=recentDays(today,30), rate=completionRate(h.completedDates,today), streak=currentStreak(h.completedDates,today), longest=longestStreak(h.completedDates), nextGrowth=growth[stage+1], daysUntil=nextGrowth ? Math.max(0,nextGrowth.threshold-h.completedDates.length) : 0;
  const daysHTML=week.map((date,i)=>`<div class="day ${date>today?'future':''}"><span>${dayLabels[i]}</span><span class="day-dot ${h.completedDates.includes(date)?'done':''} ${date===today?'today':''}" aria-label="${date}${h.completedDates.includes(date)?', completed':''}">${h.completedDates.includes(date)?'✓':''}</span></div>`).join('');
  return `<article class="habit-card" data-id="${escapeHTML(h._id)}" data-color="${escapeHTML(h.color)}"><div class="card-top"><div class="plant-wrap">${plantSVG(stage,h.color)}</div><div class="habit-info"><h3 class="habit-name">${escapeHTML(h.emoji)} ${escapeHTML(h.name)}</h3><div class="habit-meta">🔥 <b>${streak}</b> day streak</div></div><button class="menu-button" aria-label="Options for ${escapeHTML(h.name)}" data-action="menu" aria-expanded="false">⋯</button></div><div class="week-row" aria-label="This week's completion">${daysHTML}</div><div class="card-bottom"><div class="growth-copy"><span class="growth-label">${growth[stage].label}</span><span class="growth-hint">${nextGrowth ? `${daysUntil} more ${daysUntil===1?'day':'days'} to grow` : 'Your little plant is in bloom ✨'}</span></div><button class="check-button ${todayDone?'done':''}" data-action="toggle" aria-pressed="${todayDone}" aria-label="${todayDone?'Mark '+escapeHTML(h.name)+' as not done':'Mark '+escapeHTML(h.name)+' done today'}">${todayDone?'✓ Tended':'I did this'}</button></div><div class="card-menu hidden"><button data-action="stats">🌿 View 30-day stats</button><button data-action="edit">✎ Edit habit</button><button data-action="delete">↗ Remove habit</button></div><button class="stats-toggle" data-action="stats-toggle">View 30-day garden stats ⌄</button><div class="stats-panel hidden"><div class="stats-summary"><span>Current streak <b>${streak}</b></span><span>Longest <b>${longest}</b></span><span>30-day care <b>${rate}%</b></span></div><div class="heatmap" aria-label="30-day completion heatmap">${days.map(date=>{const level=h.completedDates.includes(date)?4:0;return `<span class="heat-cell level-${level}" title="${date}${level?', tended':''}" aria-label="${date}${level?', tended':''}"></span>`}).join('')}</div></div><span class="completion-count" hidden>${h.completedDates.length}</span></article>`;
}
