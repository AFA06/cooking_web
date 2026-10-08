"use client";

import * as React from "react";
import { formatDayKey, formatNumber } from "@/lib/format";

interface Point {
  day: string;
  value: number;
}

const PAD = { top: 12, right: 12, bottom: 28, left: 44 };

/** Rounds the axis maximum up to a clean step so gridlines land on readable numbers. */
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max / 4) ?? 10;
  return Math.ceil(max / (step * magnitude)) * step * magnitude;
}

export function TimeSeriesChart({ data, label, height = 280 }: { data: Point[]; label: string; height?: number }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [hover, setHover] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = height - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = data.length > 0 ? `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
  const labelEvery = Math.max(1, Math.ceil(data.length / (width < 520 ? 4 : 8)));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (data.length === 0 || innerW === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - PAD.left) / innerW;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
  };

  const active = hover !== null ? data[hover] : null;
  const tooltipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), Math.max(width - 70, 70)) : 0;

  return (
    <div ref={wrapRef} className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}: ${data.length} kun ichida jami ${formatNumber(total)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          className="touch-none select-none"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? "stroke-amber-300" : "stroke-amber-100"} />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-amber-600 text-[11px] tabular-nums">
                {formatNumber(Math.round(t))}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            (i % labelEvery === 0 && data.length - 1 - i >= labelEvery / 2) || i === data.length - 1 ? (
              <text
                key={d.day}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                className="fill-amber-600 text-[11px]"
              >
                {formatDayKey(d.day)}
              </text>
            ) : null,
          )}
          <path d={area} className="fill-amber-700/10" />
          <path d={line} fill="none" className="stroke-amber-700" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {active && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} className="stroke-amber-400" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(active.value)} r={5} className="fill-amber-700 stroke-white" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {active && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-amber-950 px-3 py-2 text-xs text-amber-50 shadow-lg"
          style={{ left: tooltipLeft }}
        >
          <span className="block text-amber-300">{formatDayKey(active.day)}</span>
          <span className="block text-sm font-semibold tabular-nums">
            {formatNumber(active.value)} <span className="font-normal text-amber-200">{label.toLowerCase()}</span>
          </span>
        </div>
      )}
    </div>
  );
}
