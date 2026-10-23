import mongoose from 'mongoose';

export const HABIT_COLORS = ['sage', 'moss', 'sky', 'lavender', 'peach', 'butter'];
const habitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  emoji: { type: String, default: '🌱', trim: true },
  color: { type: String, enum: HABIT_COLORS, default: 'sage' },
  createdAt: { type: Date, default: Date.now },
  completedDates: { type: [String], default: [], validate: { validator: dates => new Set(dates).size === dates.length, message: 'Completion dates must be unique.' } }
});
export default mongoose.model('Habit', habitSchema);
