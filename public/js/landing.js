import './layout.js';
import { plantSVG } from './plants.js';

const range = document.querySelector('#days-range');
const daysOutput = document.querySelector('#days-output');
const betterOutput = document.querySelector('#better-result');
const worseOutput = document.querySelector('#worse-result');
const positiveCurve = document.querySelector('#positive-curve');
const negativeCurve = document.querySelector('#negative-curve');
const plot = { left: 45, top: 25, width: 455, height: 200, min: Math.log(0.02), max: Math.log(40) };

function curvePath(days, factor) {
  const points = [];
  const last = Math.max(days - 1, 1);
  for (let index = 0; index < days; index += 1) {
    const value = factor ** (index + 1);
    const x = plot.left + index / last * plot.width;
    const y = plot.top + (plot.max - Math.log(value)) / (plot.max - plot.min) * plot.height;
    points.push(`${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function updateCompoundDemo() {
  const days = Number(range.value);
  const better = 1.01 ** days;
  const worse = 0.99 ** days;
  daysOutput.value = String(days);
  daysOutput.textContent = String(days);
  betterOutput.textContent = `${better.toFixed(2)}×`;
  worseOutput.textContent = `${worse.toFixed(2)}×`;
  positiveCurve.setAttribute('d', curvePath(days, 1.01));
  negativeCurve.setAttribute('d', curvePath(days, 0.99));
}

function renderPlantPreview() {
  const stages = [
    { stage: 1, color: 'sage', title: 'A new sprout', copy: 'The first little step' },
    { stage: 2, color: 'sky', title: 'A small plant', copy: 'A rhythm taking root' },
    { stage: 4, color: 'peach', title: 'In full bloom', copy: 'Care, gathered over time' }
  ];
  document.querySelector('#preview-plants').innerHTML = stages.map(({ stage, color, title, copy }) => `<article class="preview-plant reveal"><div class="preview-art" data-color="${color}">${plantSVG(stage, color)}</div><div class="preview-copy"><strong>${title}</strong><span>${copy}</span></div></article>`).join('');
  window.dispatchEvent(new Event('rootine:refresh-reveals'));
}

function renderHeroPreview() {
  const habits = [
    { name: 'Morning pages', detail: 'A quiet start', stage: 4, color: 'sage', done: true },
    { name: 'A little movement', detail: 'Find your rhythm', stage: 2, color: 'sky', done: true },
    { name: 'Read a few pages', detail: 'Keep it growing', stage: 1, color: 'peach', done: false }
  ];
  document.querySelector('#hero-habits').innerHTML = habits.map(habit => `<div class="hero-habit"><span class="hero-habit-art">${plantSVG(habit.stage, habit.color)}</span><span><span class="hero-habit-name">${habit.name}</span><span class="hero-habit-caption">${habit.detail}</span></span><span class="hero-habit-check${habit.done ? '' : ' pending'}" aria-label="${habit.done ? 'Tended today' : 'Not tended yet'}">${habit.done ? '✓' : ''}</span></div>`).join('');
}

range.addEventListener('input', updateCompoundDemo);
updateCompoundDemo();
renderHeroPreview();
renderPlantPreview();
