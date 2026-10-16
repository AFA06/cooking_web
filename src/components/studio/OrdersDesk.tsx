"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { decideOrder, revokeAccess, searchOrders, type FoundOrder } from "@/app/orders/actions";
import { Button } from "@/components/ui/Button";
import { useLocale, useT } from "@/i18n/client";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DeskOrder extends FoundOrder {
  amountText: string;
  whenText: string;
}

const inputClass = "h-12 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 text-amber-950 placeholder:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700";

/** The creator's order desk: find a buyer, check the payment, grant access. Only this creator's own orders are ever loaded. */
export function OrdersDesk({ pending, granted }: { pending: DeskOrder[]; granted: DeskOrder[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(pending[0]?.id ?? null);
  const [tab, setTab] = React.useState<"pending" | "granted">("pending");
  const [query, setQuery] = React.useState("");
  const [found, setFound] = React.useState<DeskOrder[] | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searching, setSearching] = React.useState(false);

  const all = React.useMemo(() => new Map([...pending, ...granted, ...(found ?? [])].map((o) => [o.id, o])), [pending, granted, found]);
  const list = tab === "pending" ? pending : granted;
  const order = selected ? all.get(selected) ?? null : null;

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    const result = await searchOrders(query);
    setSearching(false);
    if (result.error) setSearchError(result.error);
    setFound(result.items.map((o) => ({ ...o, amountText: formatPrice(o.amount, o.currency, t), whenText: formatDate(new Date(o.confirmedAt ?? o.createdAt), locale) })));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={runSearch} role="search" className="rounded-2xl border border-amber-200 bg-amber-100 p-5">
        <label htmlFor="order-q" className="text-sm font-medium text-amber-950">{t("studio.ord.search.label")}</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input id="order-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="DM-7K4Q2P · +998 90 123 45 67" maxLength={40} autoComplete="off" className={inputClass} aria-describedby="order-q-help" />
          <Button type="submit" size="lg" loading={searching} className="shrink-0"><Search className="h-4 w-4" aria-hidden="true" />{t("studio.ord.search.button")}</Button>
        </div>
        <p id="order-q-help" className="mt-2 text-sm text-amber-600">{t("studio.ord.search.help")}</p>
        {searchError && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{searchError}</p>}
        {found && !searchError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-2" aria-live="polite">
            {found.length === 0 ? (
              <p className="px-3 py-3 text-sm text-amber-600">{t("studio.ord.search.none")}</p>
            ) : (
              found.map((o) => (
                <button key={o.id} type="button" onClick={() => { setSelected(o.id); setTab(o.status === "paid" ? "granted" : "pending"); setFound(null); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-amber-100">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-amber-950">{o.buyerName}</span>
                    <span className="text-sm text-amber-600">{o.code} · {o.recipeTitle}</span>
                  </span>
                  <StatusPill status={o.status} />
                </button>
              ))
            )}
          </div>
        )}
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-label={t("studio.ord.waiting")}>
          <div role="tablist" className="mb-3 inline-flex rounded-md border border-amber-200 bg-amber-100 p-0.5">
            {(["pending", "granted"] as const).map((k) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("flex min-h-9 items-center gap-2 rounded px-3 text-sm", tab === k ? "bg-amber-950 font-medium text-amber-50" : "text-amber-900 hover:bg-amber-200/60")}>
                {t(k === "pending" ? "studio.ord.waiting" : "studio.ord.granted")}
                <span className="tabular-nums opacity-70">{(k === "pending" ? pending : granted).length}</span>
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-amber-300 px-5 py-8 text-center text-amber-600">{t(tab === "pending" ? "studio.ord.noneWaiting" : "studio.ord.noneGranted")}</p>
          ) : (
            <ul className="space-y-2">
              {list.map((o) => (
                <li key={o.id}>
                  <button type="button" aria-pressed={selected === o.id} onClick={() => setSelected(o.id)} className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors", selected === o.id ? "border-clay-400 bg-amber-200/60" : "border-amber-200 bg-amber-100 hover:border-amber-300")}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-amber-950">{o.buyerName}</span>
                      <span className="block truncate text-sm text-amber-600">{o.recipeTitle} · {o.amountText} · {o.whenText}</span>
                    </span>
                    <StatusPill status={o.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-live="polite" className="min-w-0">
          {order ? (
            <OrderPanel key={order.id} order={order} onDone={() => { setSelected(null); setFound(null); router.refresh(); }} />
          ) : (
            <p className="rounded-2xl border border-dashed border-amber-300 px-5 py-12 text-center text-amber-600">{t("studio.ord.pick")}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const t = useT();
  const paid = status === "paid";
  return <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", paid ? "bg-sage-100 text-sage-700" : "bg-clay-100 text-amber-800")}>{t(paid ? "order.status.paid" : "order.status.pending")}</span>;
}

function OrderPanel({ order, onDone }: { order: DeskOrder; onDone: () => void }) {
  const t = useT();
  const [checks, setChecks] = React.useState([false, false, false]);
  const [armed, setArmed] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ready = checks.every(Boolean);

  const run = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) onDone();
    else setError(r.error);
  };

  const rows: [string, string][] = [
    [t("studio.ord.code"), order.code ?? ""],
    [t("studio.ord.phone"), order.buyerPhone ?? "—"],
    [t("studio.ord.recipe"), order.recipeTitle],
    [t("studio.ord.amount"), order.amountText],
    [t("studio.ord.opened"), order.whenText],
  ];

  return (
    <div className="space-y-5 rounded-2xl border border-amber-200 bg-amber-100 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-2xl font-medium text-amber-950">{order.buyerName}</h3>
        <StatusPill status={order.status} />
      </div>
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-amber-600">{k}</dt>
            <dd className="break-words font-medium text-amber-950">{v}</dd>
          </React.Fragment>
        ))}
      </dl>

      {order.status === "pending" ? (
        <>
          <fieldset className="space-y-2">
            <legend className="sr-only">{t("studio.ord.checks")}</legend>
            {[t("studio.ord.check1"), t("studio.ord.check2", { amount: order.amountText }), t("studio.ord.check3", { name: order.buyerName, code: order.code ?? "" })].map((label, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <input type="checkbox" checked={checks[i]} onChange={(e) => { setChecks(checks.map((c, j) => (j === i ? e.target.checked : c))); setArmed(false); }} className="mt-0.5 h-5 w-5 shrink-0 accent-sage-500" />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          {armed ? (
            <div className="space-y-3">
              <p className="font-medium text-amber-950">{t("studio.ord.confirmGrant", { recipe: order.recipeTitle, name: order.buyerName })}</p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="outline" onClick={() => setArmed(false)}>{t("studio.ord.back")}</Button>
                <Button size="lg" loading={busy} onClick={() => run(() => decideOrder(order.id, "grant"))}>{t("studio.ord.confirmYes")}</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button size="lg" disabled={!ready} onClick={() => setArmed(true)}>{t("studio.ord.grant")}</Button>
              <Button size="lg" variant="outline" loading={busy} onClick={() => run(() => decideOrder(order.id, "reject"))}>{t("studio.ord.reject")}</Button>
            </div>
          )}
        </>
      ) : revoking ? (
        <div className="space-y-3">
          <label htmlFor="revoke-reason" className="text-sm font-medium text-amber-950">{t("studio.ord.revokeReason")}</label>
          <input id="revoke-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className={inputClass} />
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="outline" onClick={() => setRevoking(false)}>{t("studio.ord.back")}</Button>
            <Button size="lg" variant="destructive" loading={busy} onClick={() => run(() => revokeAccess(order.id, reason))}>{t("studio.ord.revokeConfirm")}</Button>
          </div>
        </div>
      ) : (
        <Button size="lg" variant="outline" onClick={() => setRevoking(true)}>{t("studio.ord.revoke")}</Button>
      )}
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <p className="text-sm text-amber-600">{t("studio.ord.logged")}</p>
    </div>
  );
}
