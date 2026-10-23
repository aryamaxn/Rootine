import { api } from './api.js';
import { state, setHabits, toggleDate } from './state.js';
import { ui } from './ui.js';
import './layout.js';
const $ = selector => document.querySelector(selector);
const render = () => ui.render(state);
async function loadHabits() {
  state.loading=true; state.error=null; render();
  try { setHabits(await api.list()); }
  catch (error) { state.loading=false; state.error=error.message; }
  render();
}
function selected(form, key, fallback) { return form.querySelector(`[aria-pressed="true"][data-${key}]`)?.dataset[key] || fallback; }
function bind() {
  ['#add-habit','#add-fab'].forEach(id=>$(id).addEventListener('click',()=>{state.editingId=null;ui.openHabitModal();}));
  document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{state.filter=button.dataset.filter;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===button));render();}));
  $('#garden').addEventListener('click',async event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='add'){state.editingId=null;ui.openHabitModal();return;}
    if(action==='retry'){await loadHabits();return;}
    const card=event.target.closest('.habit-card');
    if(!card){if(action==='cancel')ui.closeModal();return;}
    const habit=state.habits.find(h=>h._id===card.dataset.id); if(!habit)return;
    if(action==='menu'){const menu=card.querySelector('.card-menu');menu.classList.toggle('hidden');event.target.setAttribute('aria-expanded',String(!menu.classList.contains('hidden')));return;}
    if(action==='stats'||action==='stats-toggle'){const panel=card.querySelector('.stats-panel');panel.classList.toggle('hidden');card.classList.toggle('stats-open',!panel.classList.contains('hidden'));return;}
    if(action==='edit'){state.editingId=habit._id;ui.openHabitModal(habit);return;}
    if(action==='delete'){state.pendingDelete=habit._id;ui.confirmDelete(habit);return;}
    if(action==='toggle')await toggleHabit(habit,card);
  });
  $('#modal-root').addEventListener('click',async event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='cancel'){ui.closeModal();return;}
    if(action==='confirm-delete'){const id=state.pendingDelete;try{await api.remove(id);state.habits=state.habits.filter(h=>h._id!==id);ui.closeModal();render();ui.toast('Habit gently removed.');}catch(error){ui.closeModal();ui.toast(error.message,true);}return;}
    const emoji=event.target.closest('[data-emoji]');if(emoji){document.querySelectorAll('.emoji-choice').forEach(b=>b.setAttribute('aria-pressed',String(b===emoji)));return;}
    const color=event.target.closest('[data-color]');if(color){document.querySelectorAll('.color-choice').forEach(b=>b.setAttribute('aria-pressed',String(b===color)));}
  });
  $('#modal-root').addEventListener('submit',async event=>{
    if(event.target.id!=='habit-form')return;event.preventDefault();
    const form=event.target,name=form.elements.name.value.trim(),error=$('#name-error');
    if(!name){error.textContent='Give your habit a name to get started.';form.elements.name.focus();return;}
    if(name.length>40){error.textContent='Keep it to 40 characters or fewer.';form.elements.name.focus();return;}
    const existing=state.editingId&&state.habits.find(h=>h._id===state.editingId);
    const data={name,emoji:selected(form,'emoji',existing?.emoji||'🌱'),color:selected(form,'color',existing?.color||'sage')};
    try{if(existing){const updated=await api.update(existing._id,data);state.habits=state.habits.map(h=>h._id===updated._id?updated:h);ui.toast('Your habit has been updated.');}else{state.habits.push(await api.create(data));ui.toast('A new habit has been planted.');}ui.closeModal();state.editingId=null;render();}
    catch(err){error.textContent=err.message;ui.toast(err.message,true);}
  });
  document.addEventListener('click',event=>{if(!event.target.closest('.card-menu')&&!event.target.closest('.menu-button'))document.querySelectorAll('.card-menu').forEach(menu=>menu.classList.add('hidden'));});
}
async function toggleHabit(habit,card){
  const previous=habit.completedDates;const oldStage=stage(previous.length);habit.completedDates=toggleDate(habit,state.today);const newStage=stage(habit.completedDates.length);render();
  const updatedCard=document.querySelector(`[data-id="${CSS.escape(habit._id)}"]`);const checkButton=updatedCard?.querySelector('.check-button');
  if(checkButton)replay(checkButton,'just-toggled',600);
  const plant=updatedCard?.querySelector('.plant-wrap');
  if(plant)replay(plant,'wiggle',600);
  if(newStage>oldStage&&plant)replay(plant,'level-up',600);
  if(habit.completedDates.includes(state.today))particles(plant);
  try{const saved=await api.toggle(habit._id,state.today);state.habits=state.habits.map(h=>h._id===saved._id?saved:h);ui.renderProgress(state);ui.renderCelebration(state);}
  catch(error){habit.completedDates=previous;render();ui.toast('Your check-in didn’t save. Please try again.',true);}
}
function stage(count){return count>=14?4:count>=7?3:count>=3?2:count>=1?1:0;}
function replay(element,className,duration){element.classList.remove(className);void element.offsetWidth;element.classList.add(className);window.setTimeout(()=>element.classList.remove(className),duration);}
function particles(plant){if(!plant)return;const bits=['🍃','✦','🌿','✧','🍃','✦'];for(const [index,glyph] of bits.entries()){const particle=document.createElement('span');particle.className='plant-particle';particle.textContent=glyph;particle.style.setProperty('--start-x',`${36+(index%3)*14}%`);particle.style.setProperty('--start-y',`${39+Math.floor(index/3)*14}%`);particle.style.setProperty('--dx',`${Math.random()*68-34}px`);particle.style.setProperty('--dy',`${Math.random()*-54-22}px`);plant.append(particle);window.setTimeout(()=>particle.remove(),600);}}
bind();render();await loadHabits();
