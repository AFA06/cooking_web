import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-amber-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-950">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-medium text-amber-950 break-words sm:text-[2.6rem] sm:leading-tight">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-amber-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  flush = false,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Removes body padding, for tables that run edge to edge. */
  flush?: boolean;
}) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-amber-200 bg-white", className)}>
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-serif text-xl font-medium text-amber-950">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-amber-600">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}

/** Change against the previous period. `null` when the previous value was zero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function Delta({ current, previous }: { current: number; previous: number }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className="text-xs font-medium text-emerald-700">Yangi</span>;
  if (change === 0) return <span className="text-xs text-amber-600">O‘zgarishsiz</span>;
  const up = change > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold tabular-nums", up ? "text-emerald-700" : "text-red-700")}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {up ? "+" : "−"}
      {Math.abs(change)}%
    </span>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? 100 / (values.length - 1) : 100;
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(26 - (v / max) * 24).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-9 w-full", className)} aria-hidden="true">
      <polygon points={`0,28 ${points} 100,28`} className="fill-amber-700/10" />
      <polyline points={points} fill="none" className="stroke-amber-700" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  suffix,
  current,
  previous,
  series,
  hint,
}: {
  label: string;
  value: string;
  suffix?: string;
  current?: number;
  previous?: number;
  series?: number[];
  hint?: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-amber-200 bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">{label}</p>
      <p className="mt-3 font-serif text-4xl font-medium tabular-nums text-amber-950 sm:text-[2.75rem] sm:leading-none">
        {value}
        {suffix && <span className="ml-1 text-xl text-amber-600">{suffix}</span>}
      </p>
      <div className="mt-3 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-0.5">
        {current !== undefined && previous !== undefined && (
          <>
            <Delta current={current} previous={previous} />
            <span className="text-xs text-amber-600">o‘tgan davrga nisbatan</span>
          </>
        )}
        {hint && <span className="text-xs text-amber-600">{hint}</span>}
      </div>
      {series && <Sparkline values={series} className="mt-4" />}
    </div>
  );
}

export function BarList({
  items,
  empty,
  unit,
}: {
  items: { key: string; label: string; sublabel?: string; value: number; href?: string }[];
  empty: string;
  unit?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0 || items.every((i) => i.value === 0)) return <p className="py-6 text-center text-sm text-amber-600">{empty}</p>;
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-sm text-amber-950">
              {i.href ? <Link href={i.href} className="font-medium hover:text-amber-700 hover:underline">{i.label}</Link> : <span className="font-medium">{i.label}</span>}
              {i.sublabel && <span className="ml-2 text-amber-600">{i.sublabel}</span>}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-950">
              {formatNumber(i.value)}
              {unit && <span className="ml-1 font-normal text-amber-600">{unit}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full rounded-full bg-amber-700" style={{ width: `${Math.max((i.value / max) * 100, i.value > 0 ? 2 : 0)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SegmentedLinks({ items, label }: { items: { href: string; label: string; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-md border border-amber-200 bg-white p-0.5">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "true" : undefined}
          className={cn(
            "flex min-h-9 items-center rounded px-3 text-sm transition-colors",
            i.active ? "bg-amber-950 font-medium text-amber-50" : "text-amber-900 hover:bg-amber-100",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function SearchForm({ action, defaultValue, placeholder, hidden }: { action: string; defaultValue?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form action={action} role="search" className="relative w-full sm:w-80">
      {hidden && Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor="admin-search" className="sr-only">{placeholder}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" aria-hidden="true" />
      <input
        id="admin-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-amber-200 bg-white pl-9 pr-3 text-sm text-amber-950 placeholder:text-amber-500 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/20"
      />
    </form>
  );
}

export function Pagination({ page, total, pageSize, hrefFor }: { page: number; total: number; pageSize: number; hrefFor: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const linkCls = "inline-flex h-10 items-center gap-1 rounded-md border border-amber-200 bg-white px-3 text-sm text-amber-950 hover:bg-amber-100";
  const disabledCls = "inline-flex h-10 items-center gap-1 rounded-md border border-amber-100 px-3 text-sm text-amber-400";
  return (
    <nav aria-label="Sahifalar" className="flex items-center justify-between gap-4 border-t border-amber-100 px-5 py-4 sm:px-6">
      <p className="text-sm text-amber-600">
        {page} / {pages} sahifa · jami {formatNumber(total)} ta
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkCls}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Oldingi</Link>
        ) : (
          <span className={disabledCls} aria-disabled="true"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Oldingi</span>
        )}
        {page < pages ? (
          <Link href={hrefFor(page + 1)} className={linkCls}>Keyingi<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
        ) : (
          <span className={disabledCls} aria-disabled="true">Keyingi<ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
        )}
      </div>
    </nav>
  );
}

export const table = {
  wrap: "overflow-x-auto",
  root: "w-full min-w-[44rem] text-left text-sm",
  th: "whitespace-nowrap border-b border-amber-200 bg-amber-50/70 px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-amber-600 first:pl-6 last:pr-6",
  thNum: "text-right",
  tr: "border-b border-amber-100 last:border-0 hover:bg-amber-50/60",
  td: "px-5 py-3.5 align-middle text-amber-950 first:pl-6 last:pr-6",
  tdNum: "text-right tabular-nums",
};

export function StatusPill({ tone, children }: { tone: "good" | "neutral" | "accent" | "warn"; children: React.ReactNode }) {
  const tones = {
    good: "bg-emerald-100 text-emerald-800",
    neutral: "bg-amber-100 text-amber-900",
    accent: "bg-amber-700 text-white",
    warn: "bg-rose-100 text-rose-800",
  };
  const dots = { good: "bg-emerald-700", neutral: "bg-amber-500", accent: "bg-white", warn: "bg-rose-800" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail from an arbitrary host
    return <img src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" loading="lazy" />;
  }
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-amber-100 font-serif font-semibold text-amber-900" aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-xl text-amber-950">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-amber-600">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const fieldCls =
  "mt-1.5 w-full min-h-11 rounded-md border border-amber-200 bg-white px-3 py-2 text-amber-950 placeholder:text-amber-500 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/20";

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-amber-950">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-amber-600">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldCls, props.className)} />;
}

export function CheckboxField({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-5 w-5 accent-amber-700" />
      <span>
        <span className="block text-sm font-medium text-amber-950">{label}</span>
        {hint && <span className="block text-xs text-amber-600">{hint}</span>}
      </span>
    </label>
  );
}
