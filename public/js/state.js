import { localDateString } from './streaks.js';
export const state = { habits: [], filter: 'all', loading: true, error: null, today: localDateString() };
export function setHabits(habits) { state.habits = habits; state.loading = false; state.error = null; }
export function toggleDate(habit, date) {
  const dates = new Set(habit.completedDates);
  dates.has(date) ? dates.delete(date) : dates.add(date);
  return [...dates];
}
