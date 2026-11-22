import { useMemo, useState } from 'react';

const niceMax = (v) => {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
};

const fmtAxis = (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}M` : v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : `${v}`);

/**
 * Minimal SVG bar chart with hover readout. data: [{ label, value }]
 * One accent colour, light gridlines, tabular axis labels.
 */
export function BarChart({ data = [], height = 220, color = '#13224a', format = (v) => v, emptyLabel = 'No data yet' }) {
  const [hover, setHover] = useState(null);
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const W = 640;
  const H = height;
  const pad = { t: 12, r: 8, b: 26, l: 44 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = data.length ? innerW / data.length : innerW;
  const barW = Math.min(36, step * 0.56);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart">
        {ticks.map((t) => {
          const y = pad.t + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={t === 0 ? '' : '3 3'} />
              <text x={pad.l - 8} y={y + 3.5} textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">{fmtAxis(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.l + i * step + (step - barW) / 2;
          const y = pad.t + innerH - h;
          const active = hover === i;
          return (
            <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * step} y={pad.t} width={step} height={innerH} fill="transparent" />
              <rect x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 2 : 0)} rx={3} fill={color} opacity={hover === null || active ? 1 : 0.35} />
              <text x={pad.l + i * step + step / 2} y={H - 8} textAnchor="middle" className={`text-[10px] ${active ? 'fill-navy-900' : 'fill-slate-500'}`}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-[0_6px_16px_-8px_rgb(15_23_42/0.3)]"
          style={{ left: `${((pad.l + hover * step + step / 2) / W) * 100}%`, top: 0 }}
        >
          <div className="text-slate-500">{data[hover].label}</div>
          <div className="font-semibold tabular-nums text-navy-900">{format(data[hover].value)}</div>
        </div>
      )}
      {total === 0 && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">{emptyLabel}</div>}
    </div>
  );
}

/** Minimal SVG line/area chart. data: [{ label, value }] */
export function LineChart({ data = [], height = 220, color = '#c99227', format = (v) => v }) {
  const [hover, setHover] = useState(null);
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const W = 640;
  const H = height;
  const pad = { t: 12, r: 12, b: 26, l: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i) => pad.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => pad.t + innerH - (v / max) * innerH;
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = data.length ? `${line} L${x(data.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z` : '';
  const ticks = [0, 0.5, 1].map((f) => max * f);
  const gradId = useMemo(() => `lg-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Line chart" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.14" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? '' : '3 3'} />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">{fmtAxis(Math.round(t))}</text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.label + i}>
            <rect x={x(i) - innerW / Math.max(1, data.length) / 2} y={pad.t} width={innerW / Math.max(1, data.length)} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
            {hover === i && <line x1={x(i)} x2={x(i)} y1={pad.t} y2={pad.t + innerH} stroke="#cbd5e1" />}
            <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 4 : 0} fill="white" stroke={color} strokeWidth="2" />
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">{d.label}</text>
          </g>
        ))}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-[0_6px_16px_-8px_rgb(15_23_42/0.3)]"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }}
        >
          <div className="text-slate-500">{data[hover].label}</div>
          <div className="font-semibold tabular-nums text-navy-900">{format(data[hover].value)}</div>
        </div>
      )}
    </div>
  );
}

/** Horizontal proportion bars (tier distribution). data: [{ label, value, color }] */
export function DistributionBars({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        {data.map((d) => (
          <div key={d.label} style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }} />
        ))}
      </div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
              {d.label}
            </span>
            <span className="tabular-nums text-navy-900">
              {d.value} <span className="text-slate-400">· {Math.round((d.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
