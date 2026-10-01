// Swipe-between-tabs rules used by app/(tabs)/_layout.tsx.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TAB_ORDER, isHorizontalDrag, swipeTarget, lockTabSwipe, unlockTabSwipe, isTabSwipeLocked } from './tabSwipe.js';

test('swiping left goes to the next tab, right to the previous', () => {
  assert.equal(swipeTarget('assessments', -120, 5), 'activities');
  assert.equal(swipeTarget('assessments', 120, 5), 'dashboard');
});

test('the first and last tabs do not wrap around', () => {
  assert.equal(swipeTarget(TAB_ORDER[0], 120, 0), null);
  assert.equal(swipeTarget(TAB_ORDER[TAB_ORDER.length - 1], -120, 0), null);
});

test('short, slow or mostly vertical drags do not change tab', () => {
  assert.equal(swipeTarget('partner', -40, 0, 0.1), null);
  assert.equal(swipeTarget('partner', -100, 80), null);
  assert.equal(swipeTarget('partner', -10, 0, 2), null);
});

test('a short but fast flick changes tab', () => {
  assert.equal(swipeTarget('partner', -35, 4, -0.9), 'messages');
});

test('screens outside the tab bar are ignored', () => {
  assert.equal(swipeTarget('daily-question', -200, 0), null);
  assert.equal(swipeTarget(undefined, -200, 0), null);
});

test('only clearly sideways drags are claimed from scroll views', () => {
  assert.equal(isHorizontalDrag(30, 5), true);
  assert.equal(isHorizontalDrag(15, 0), false);
  assert.equal(isHorizontalDrag(30, 20), false);
  assert.equal(isHorizontalDrag(4, 60), false);
});

test('horizontal scrollers can hold the lock', () => {
  assert.equal(isTabSwipeLocked(), false);
  lockTabSwipe();
  assert.equal(isTabSwipeLocked(), true);
  unlockTabSwipe();
  assert.equal(isTabSwipeLocked(), false);
});
