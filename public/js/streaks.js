/** Local calendar dates are deliberately constructed from local components, never UTC. */
export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return localDateString(date);
}

export function currentStreak(completedDates, today = localDateString()) {
  const dates = new Set(completedDates);
  let cursor = dates.has(today) ? today : shiftDate(today, -1);
  if (!dates.has(cursor)) return 0;
  let streak = 0;
  while (dates.has(cursor)) { streak += 1; cursor = shiftDate(cursor, -1); }
  return streak;
}

export function longestStreak(completedDates) {
  const dates = [...new Set(completedDates)].sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const date of dates) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return longest;
}

export function completionRate(completedDates, today = localDateString(), days = 30) {
  const set = new Set(completedDates);
  let count = 0;
  for (let offset = 0; offset < days; offset += 1) if (set.has(shiftDate(today, -offset))) count += 1;
  return days ? Math.round((count / days) * 100) : 0;
}

export function recentDays(today = localDateString(), days = 30) {
  return Array.from({ length: days }, (_, index) => shiftDate(today, -(days - index - 1)));
}

export function weekDates(today = localDateString()) {
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(date); d.setDate(d.getDate() + i); return localDateString(d); });
}
