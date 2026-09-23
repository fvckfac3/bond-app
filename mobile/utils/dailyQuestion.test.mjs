import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateString, pickDailyQuestion, rotationDay } from './dailyQuestion.js';

const questions = Array.from({ length: 90 }, (_, i) => ({ id: `q${i + 1}`, sort_order: i + 1 }));

test('rotation starts at the first question on 2026-01-01 and advances one per day', () => {
  assert.equal(pickDailyQuestion(questions, '2026-01-01').id, 'q1');
  assert.equal(pickDailyQuestion(questions, '2026-01-02').id, 'q2');
  assert.equal(pickDailyQuestion(questions, '2026-03-31').id, 'q90');
  assert.equal(pickDailyQuestion(questions, '2026-04-01').id, 'q1'); // wraps after 90 days
});

test('dates before the rotation start still map into the list', () => {
  assert.equal(rotationDay('2025-12-31'), -1);
  assert.equal(pickDailyQuestion(questions, '2025-12-31').id, 'q90');
});

test('month and year boundaries and DST dates do not skip or repeat a day', () => {
  let previous = rotationDay('2026-01-01');
  for (let t = Date.UTC(2026, 0, 2); t <= Date.UTC(2027, 11, 31); t += 86400000) {
    const day = rotationDay(new Date(t).toISOString().slice(0, 10));
    assert.equal(day, previous + 1);
    previous = day;
  }
});

test('both partners get the same question for the same date', () => {
  const a = pickDailyQuestion(questions, '2026-09-23');
  const b = pickDailyQuestion([...questions], '2026-09-23');
  assert.equal(a.id, b.id);
});

test('no questions means no question', () => {
  assert.equal(pickDailyQuestion([], '2026-09-23'), null);
});

test('localDateString uses the local calendar date', () => {
  assert.equal(localDateString(new Date(2026, 8, 3, 23, 59)), '2026-09-03');
});
