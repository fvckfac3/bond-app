// Which daily question a couple sees on a given day.
//
// Everyone gets the same question on the same calendar day: the active questions, in
// sort_order, rotate one per day. Both partners compute it independently, so it must
// depend only on the date (their local calendar date, as YYYY-MM-DD).

const DAY_MS = 24 * 60 * 60 * 1000;
const ROTATION_START = Date.UTC(2026, 0, 1); // day 0 of the rotation

/** Local calendar date as YYYY-MM-DD (not UTC, so "today" matches the user's clock). */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days between the rotation start and a YYYY-MM-DD date (negative before it). */
export function rotationDay(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - ROTATION_START) / DAY_MS);
}

/**
 * The question for a date. `questions` must already be the active questions sorted by
 * sort_order (then id, for a stable order). Returns null when there are none.
 */
export function pickDailyQuestion(questions, dateString) {
  if (!questions?.length) return null;
  const n = questions.length;
  const index = ((rotationDay(dateString) % n) + n) % n;
  return questions[index];
}
