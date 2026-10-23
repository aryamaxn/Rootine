import mongoose from 'mongoose';
import Habit, { HABIT_COLORS } from '../models/Habit.js';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
// Validate calendar components in UTC so the server's timezone cannot shift a valid local date.
const validDate = value => {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};
function validateFields({ name, emoji, color }) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 40) { const e = new Error('Give your habit a name of up to 40 characters.'); e.status = 400; throw e; }
  if (emoji !== undefined && (typeof emoji !== 'string' || emoji.length > 16)) { const e = new Error('Choose a valid emoji.'); e.status = 400; throw e; }
  if (color !== undefined && !HABIT_COLORS.includes(color)) { const e = new Error('Choose one of the available garden colors.'); e.status = 400; throw e; }
}
async function findHabit(req) {
  if (!mongoose.isValidObjectId(req.params.id)) { const e = new Error('That habit could not be found.'); e.status = 404; throw e; }
  const habit = await Habit.findById(req.params.id);
  if (!habit) { const e = new Error('That habit could not be found.'); e.status = 404; throw e; }
  return habit;
}
export async function listHabits(req, res) { res.json(await Habit.find().sort({ createdAt: 1 })); }
export async function createHabit(req, res) {
  validateFields(req.body);
  const habit = await Habit.create({ name: req.body.name.trim(), emoji: req.body.emoji || '🌱', color: req.body.color || 'sage' });
  res.status(201).json(habit);
}
export async function updateHabit(req, res) {
  validateFields(req.body);
  const habit = await findHabit(req);
  habit.name = req.body.name.trim();
  if (req.body.emoji !== undefined) habit.emoji = req.body.emoji;
  if (req.body.color !== undefined) habit.color = req.body.color;
  res.json(await habit.save());
}
export async function deleteHabit(req, res) { await (await findHabit(req)).deleteOne(); res.status(204).end(); }
export async function toggleHabit(req, res) {
  const { date } = req.body;
  if (typeof date !== 'string' || !validDate(date)) { const e = new Error('Use a valid date in YYYY-MM-DD format.'); e.status = 400; throw e; }
  const habit = await findHabit(req);
  const dates = new Set(habit.completedDates);
  dates.has(date) ? dates.delete(date) : dates.add(date);
  habit.completedDates = [...dates];
  res.json(await habit.save());
}
