// Swiping left/right on a tab screen moves to the neighbouring tab (same order as the tab bar).

export const TAB_ORDER = ['dashboard', 'assessments', 'activities', 'partner', 'messages', 'progress', 'profile'];

const MIN_DISTANCE = 60;
const MIN_FAST_DISTANCE = 30;
const FAST_VELOCITY = 0.5;

/** True once a drag is clearly sideways, so vertical scrolling is never taken over. */
export function isHorizontalDrag(dx, dy) {
  return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2;
}

/** The tab a finished swipe lands on, or null when it shouldn't change tab. */
export function swipeTarget(current, dx, dy, vx = 0) {
  const index = TAB_ORDER.indexOf(current);
  if (index === -1 || Math.abs(dx) < Math.abs(dy) * 2) return null;
  const far = Math.abs(dx) >= MIN_DISTANCE;
  const fast = Math.abs(dx) >= MIN_FAST_DISTANCE && Math.abs(vx) >= FAST_VELOCITY;
  if (!far && !fast) return null;
  // Swiping left (negative dx) reveals the tab to the right.
  return TAB_ORDER[index + (dx < 0 ? 1 : -1)] ?? null;
}

// Horizontal scrollers inside a tab hold this while touched so they scroll instead of switching tab.
let locked = false;
export const lockTabSwipe = () => { locked = true; };
export const unlockTabSwipe = () => { locked = false; };
export const isTabSwipeLocked = () => locked;
