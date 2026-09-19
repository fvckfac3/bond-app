# Bond — Design System Reference

**Governed by:** 00 — Master Index · Reference document
**Source:** `mobile/constants/theme.js`

## 1. Palette (as implemented — "warm romantic theme," per the file's own comment)

| Token | Hex | Use |
|---|---|---|
| primary | #3D1A4F (Deep Plum) | Headings, primary buttons |
| accent | #C2607A (Rose) | CTAs, highlights, interactive elements |
| blush | #F4C6CC (Blush) | Backgrounds, cards |
| gold | #C9933C (Gold) | Achievement badges, premium |
| teal | #1E8C8C (Teal) | Positive insights, success states |
| error | #D94F4F | Deliberately softer than a harsh red (comment in source: "not harsh") |
| success | #1E8C8C | Same value as `teal` — intentional reuse |
| warning | #D4933C | |
| background | #FAFAFA | |
| surface | #FDF9FA (warm-tinted white) | |

**Design rule worth preserving:** the error color is deliberately desaturated ("softer red, not harsh" per the source comment) — same instinct as Sentient Self's dark-mode error token. For a relationship app where "error" states might appear alongside emotionally loaded content (a low assessment score, a flagged communication pattern), don't let a future contributor swap this for a standard alarm red.

## 2. Spacing
8pt grid: xxs(2) / xs(4) / sm(8) / md(16) / lg(24) / xl(32) / xxl(48) / xxxl(64).

## 3. Fonts
System font for both heading and body (no custom font family loaded as of this file) — confirm this is intentional rather than an unfinished font-loading step, since `expo-font` is a listed dependency.

## 4. Component/Animation Stack
`moti` + `react-native-reanimated` + `react-native-skia` for animation/graphics, `react-native-paper` for base components, `echarts`/`react-native-chart-kit` for progress/data visualization (Progress tab, assessment results).

## 5. Note for Design System Extension
This file is much shorter than a typical design-token set (no documented border-radius scale shown in the excerpt reviewed, no typography scale beyond font family) — if extending, check the full `theme.js` file directly rather than assuming this reference is exhaustive; it reflects what was confirmed in this audit pass, not necessarily everything in the file.

---
**END OF DESIGN SYSTEM REFERENCE**
