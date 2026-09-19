import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessage, mergeHistory } from './messages.js';

const m = (id, t) => ({ id, created_at: `2026-01-01T00:00:0${t}Z` });

test('ignores a message that is already in the list', () => {
  const list = [m('a', 1)];
  assert.equal(mergeMessage(list, m('a', 1)), list);
});

test('appends new messages in timestamp order', () => {
  const out = mergeMessage([m('a', 1), m('c', 3)], m('b', 2));
  assert.deepEqual(out.map((x) => x.id), ['a', 'b', 'c']);
});

test('history fetched after a realtime event does not duplicate it', () => {
  const out = mergeHistory([m('b', 2)], [m('a', 1), m('b', 2)]);
  assert.deepEqual(out.map((x) => x.id), ['a', 'b']);
});

test('ignores payloads without an id', () => {
  const list = [m('a', 1)];
  assert.equal(mergeMessage(list, null), list);
});
