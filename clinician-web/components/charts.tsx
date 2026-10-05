import type { DailyConnectionRow, ExerciseCompletionRow } from '@/lib/types';

// Categorical slots 1-2 of the validated default chart palette (light surface #ffffff, all checks pass).
const SERIES_1 = '#2a78d6';
const SERIES_2 = '#eb6834';
const GRID = '#e2e8f0';
const INK_MUTED = '#64748b';

const W = 640;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / step) * step;
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

interface Stack {
  key: string;
  label: string;
  a: number;
  b: number;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-4 text-xs text-slate-700">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function YGrid({ max }: { max: number }) {
  const ticks = [0, max / 2, max];
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.top + plotH - (t / max) * plotH;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize={10} fill={INK_MUTED}>
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Two-series stacked bars with a 2px surface gap between segments; native <title> tooltips per bar.
function StackedBars({ data, labelA, labelB, title }: { data: Stack[]; labelA: string; labelB: string; title: string }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.a + d.b)));
  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.max(2, Math.min(28, slot * 0.6));
  const labelEvery = Math.ceil(data.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
      <YGrid max={max} />
      {data.map((d, i) => {
        const x = PAD.left + i * slot + (slot - barW) / 2;
        const hA = (d.a / max) * plotH;
        const hB = (d.b / max) * plotH;
        const base = PAD.top + plotH;
        const gap = hA > 0 && hB > 0 ? 2 : 0;
        return (
          <g key={d.key}>
            <title>{`${d.label}: ${labelA} ${d.a}, ${labelB} ${d.b}`}</title>
            <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" />
            {hA > 0 && <rect x={x} y={base - hA} width={barW} height={hA} fill={SERIES_1} rx={hB > 0 ? 0 : 2} />}
            {hB > 0 && <rect x={x} y={base - hA - gap - hB} width={barW} height={hB} fill={SERIES_2} rx={2} />}
            {i % labelEvery === 0 && (
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize={10} fill={INK_MUTED}>
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-2 text-xs text-slate-600">
      <summary className="cursor-pointer">Show as table</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{head.map((h) => <th key={h} className="py-1 pr-4 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="py-0.5 pr-4">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function WeeklyExerciseChart({ rows }: { rows: ExerciseCompletionRow[] }) {
  const weeks = new Map<string, Stack>();
  for (const r of rows) {
    const w = weeks.get(r.week_start) ?? { key: r.week_start, label: shortDate(r.week_start), a: 0, b: 0 };
    if (r.gottman_informed) w.a += r.completions;
    else w.b += r.completions;
    weeks.set(r.week_start, w);
  }
  const data = [...weeks.values()].sort((x, y) => x.key.localeCompare(y.key));
  const title = 'Weekly exercise completions';
  if (data.length === 0) {
    return <p className="text-sm text-slate-600">No exercises completed since this couple consented.</p>;
  }
  return (
    <figure>
      <Legend items={[{ label: 'Gottman-informed exercises', color: SERIES_1 }, { label: 'Other exercises', color: SERIES_2 }]} />
      <StackedBars data={data} labelA="Gottman-informed" labelB="Other" title={title} />
      <DataTable
        caption={title}
        head={['Week of', 'Category', 'Gottman-informed', 'Completions']}
        rows={rows.map((r) => [shortDate(r.week_start), r.category, r.gottman_informed ? 'Yes' : 'No', r.completions])}
      />
    </figure>
  );
}

export function DailyActivityChart({ rows }: { rows: DailyConnectionRow[] }) {
  const data = rows.map((r) => ({ key: r.day, label: shortDate(r.day), a: r.check_ins, b: r.daily_answers }));
  const title = 'Daily check-ins and daily-question answers';
  return (
    <figure>
      <Legend items={[{ label: 'Check-ins', color: SERIES_1 }, { label: 'Daily question answers', color: SERIES_2 }]} />
      <StackedBars data={data} labelA="Check-ins" labelB="Answers" title={title} />
      <DataTable caption={title} head={['Day', 'Check-ins', 'Daily answers']} rows={rows.map((r) => [shortDate(r.day), r.check_ins, r.daily_answers])} />
    </figure>
  );
}

// Mean check-in connection rating (1-5). Its own chart and axis: never overlaid on the counts.
export function ConnectionRatingChart({ rows }: { rows: DailyConnectionRow[] }) {
  const title = 'Average check-in connection rating (1–5)';
  const n = rows.length;
  const xAt = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => PAD.top + plotH - ((v - 1) / 4) * plotH;
  const points = rows.map((r, i) => (r.avg_connection === null ? null : { x: xAt(i), y: yAt(Number(r.avg_connection)), r }));
  const segments: string[] = [];
  let current: string[] = [];
  for (const p of points) {
    if (p) current.push(`${p.x},${p.y}`);
    else if (current.length) {
      segments.push(current.join(' '));
      current = [];
    }
  }
  if (current.length) segments.push(current.join(' '));
  const labelEvery = Math.ceil(n / 8);
  const rated = rows.filter((r) => r.avg_connection !== null);
  if (rated.length === 0) {
    return <p className="text-sm text-slate-600">No check-in ratings in this period.</p>;
  }
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        {[1, 3, 5].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yAt(t)} y2={yAt(t)} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 6} y={yAt(t) + 3} textAnchor="end" fontSize={10} fill={INK_MUTED}>
              {t}
            </text>
          </g>
        ))}
        {segments.map((s) => (
          <polyline key={s} points={s} fill="none" stroke={SERIES_1} strokeWidth={2} strokeLinejoin="round" />
        ))}
        {points.map((p) =>
          p ? (
            <g key={p.r.day}>
              <title>{`${shortDate(p.r.day)}: ${Number(p.r.avg_connection).toFixed(1)}`}</title>
              <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
              <circle cx={p.x} cy={p.y} r={4} fill={SERIES_1} stroke="#ffffff" strokeWidth={2} />
            </g>
          ) : null,
        )}
        {rows.map((r, i) =>
          i % labelEvery === 0 ? (
            <text key={r.day} x={xAt(i)} y={H - 10} textAnchor="middle" fontSize={10} fill={INK_MUTED}>
              {shortDate(r.day)}
            </text>
          ) : null,
        )}
      </svg>
      <DataTable caption={title} head={['Day', 'Average rating']} rows={rated.map((r) => [shortDate(r.day), Number(r.avg_connection).toFixed(1)])} />
    </figure>
  );
}
