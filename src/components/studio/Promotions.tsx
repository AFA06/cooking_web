"use client";

import * as React from "react";
import { Check, Copy, Percent, Shuffle, Trash2 } from "lucide-react";
import { removePromo, savePromoCode, saveSale, stopSale, togglePromo, type PromoFormState } from "@/app/dashboard/promotions/actions";
import { PriceTag } from "@/components/recipe/PriceTag";
import { Button } from "@/components/ui/Button";
import { useLocale, useT } from "@/i18n/client";
import { formatDate, formatPrice } from "@/lib/format";
import { saleIsActive } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const input = "h-11 w-full rounded-xl border border-amber-300 bg-amber-50 px-3 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";
const labelCls = "text-sm font-medium text-amber-950";

export interface SaleRecipe {
  id: string;
  title: string;
  price: number | null;
  salePrice: number | null;
  saleEndsAt: string | null;
  published: boolean;
}

function Duration({ label, hint }: { label: string; hint: string }) {
  const t = useT();
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="mt-1.5 flex gap-2">
        <input name="duration" type="number" min={1} max={2160} inputMode="numeric" placeholder="—" aria-label={label} className={cn(input, "w-24")} />
        <select name="unit" defaultValue="hours" aria-label={t("promo.unit")} className={cn(input, "w-32")}>
          <option value="hours">{t("promo.hours")}</option>
          <option value="days">{t("promo.days")}</option>
        </select>
      </div>
      <p className="mt-1 text-xs text-amber-600">{hint}</p>
    </div>
  );
}

function Result({ state }: { state: PromoFormState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-medium text-emerald-700">{state.ok}</p>;
  return null;
}

/** One premium recipe: its price now, and a form to start or change a sale. */
export function SaleRow({ recipe }: { recipe: SaleRecipe }) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = React.useActionState<PromoFormState, FormData>(saveSale.bind(null, recipe.id), {});
  const [value, setValue] = React.useState("");
  const [stopping, startStop] = React.useTransition();
  const active = saleIsActive({ price: recipe.price, salePrice: recipe.salePrice, saleEndsAt: recipe.saleEndsAt });
  const price = recipe.price ?? 0;

  return (
    <li className="grid grid-cols-1 gap-5 border-b border-amber-200 px-5 py-5 last:border-b-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="min-w-0">
        <p className="truncate font-medium text-amber-950">{recipe.title}</p>
        {!recipe.published && <p className="text-xs text-amber-600">{t("promo.draft")}</p>}
        <div className="mt-2">
          {recipe.price ? <PriceTag price={recipe.price} salePrice={recipe.salePrice} saleEndsAt={recipe.saleEndsAt} tone="dark" size="md" details className="text-amber-950" /> : <span className="text-sm text-amber-600">{t("promo.noPrice")}</span>}
        </div>
        {active && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-amber-600">
            {recipe.saleEndsAt ? t("promo.endsOn", { date: `${formatDate(new Date(recipe.saleEndsAt), locale)} ${new Date(recipe.saleEndsAt).toLocaleTimeString(locale === "en" ? "en-GB" : "ru-RU", { hour: "2-digit", minute: "2-digit" })}` }) : t("promo.noEnd")}
            <Button type="button" size="sm" variant="outline" loading={stopping} onClick={() => startStop(() => stopSale(recipe.id))}>{t("promo.stopSale")}</Button>
          </div>
        )}
      </div>
      {recipe.price ? (
        <form action={action} className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor={`sale-${recipe.id}`} className={labelCls}>{t("promo.newPrice")}</label>
              <input id={`sale-${recipe.id}`} name="salePrice" type="number" min={0} max={price - 1} required inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className={cn(input, "mt-1.5 w-36")} />
              <div className="mt-1.5 flex gap-1.5">
                {[10, 20, 30, 50].map((pct) => (
                  <button key={pct} type="button" onClick={() => setValue(String(Math.round((price * (100 - pct)) / 100 / 100) * 100))} className="rounded-full border border-amber-300 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:border-amber-950">
                    −{pct}%
                  </button>
                ))}
              </div>
            </div>
            <Duration label={t("promo.saleFor")} hint={t("promo.saleForHint")} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" loading={pending}><Percent className="h-4 w-4" aria-hidden="true" />{active ? t("promo.updateSale") : t("promo.startSale")}</Button>
            <Result state={state} />
          </div>
        </form>
      ) : (
        <p className="text-sm text-amber-600">{t("promo.setPriceFirst")}</p>
      )}
    </li>
  );
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Form for a new promo code: what it gives, on which recipes, how many times and for how long. */
export function PromoForm({ recipes, prefix }: { recipes: { id: string; title: string }[]; prefix: string }) {
  const t = useT();
  const [kind, setKind] = React.useState<"percent" | "amount" | "free">("percent");
  const [scope, setScope] = React.useState<"all" | "chosen">("all");
  const [code, setCode] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, action, pending] = React.useActionState<PromoFormState, FormData>(async (prev, formData) => {
    const result = await savePromoCode(prev, formData);
    // A saved code clears the form for the next one.
    if (result.ok) {
      formRef.current?.reset();
      setCode("");
    }
    return result;
  }, {});

  const generate = () => {
    const bytes = crypto.getRandomValues(new Uint32Array(4));
    setCode(`${prefix}${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`);
  };

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div>
        <label htmlFor="promo-code" className={labelCls}>{t("promo.code")}</label>
        <div className="mt-1.5 flex gap-2">
          <input id="promo-code" name="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={20} placeholder={t("promo.codePlaceholder")} autoComplete="off" spellCheck={false} className={cn(input, "font-mono uppercase tracking-wider")} />
          <Button type="button" variant="outline" onClick={generate}><Shuffle className="h-4 w-4" aria-hidden="true" />{t("promo.generate")}</Button>
        </div>
        <p className="mt-1 text-xs text-amber-600">{t("promo.codeHint")}</p>
      </div>

      <fieldset>
        <legend className={labelCls}>{t("promo.gives")}</legend>
        <div className="mt-1.5 grid grid-cols-3 rounded-xl border border-amber-300 p-1">
          {(["percent", "amount", "free"] as const).map((k) => (
            <label key={k} className={cn("flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium", kind === k ? "bg-amber-950 text-amber-50" : "text-amber-900")}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {t(`promo.kind.${k}`)}
            </label>
          ))}
        </div>
        {kind !== "free" ? (
          <div className="mt-3 flex items-center gap-2">
            <input name="value" type="number" required min={1} max={kind === "percent" ? 99 : undefined} inputMode="numeric" aria-label={t(`promo.kind.${kind}`)} className={cn(input, "w-36")} />
            <span className="text-amber-600">{kind === "percent" ? "%" : t("unit.som")}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-amber-600">{t("promo.freeHint")}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelCls}>{t("promo.appliesTo")}</legend>
        <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-amber-950">
          <label className="flex items-center gap-2"><input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} className="accent-clay-400" />{t("promo.allRecipes")}</label>
          <label className="flex items-center gap-2"><input type="radio" name="scope" value="chosen" checked={scope === "chosen"} onChange={() => setScope("chosen")} className="accent-clay-400" />{t("promo.chosenRecipes")}</label>
        </div>
        {scope === "chosen" && (
          <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-amber-200 p-2">
            {recipes.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-amber-950 hover:bg-amber-100">
                <input type="checkbox" name="recipeIds" value={r.id} className="h-4 w-4 accent-clay-400" />
                <span className="truncate">{r.title}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-6">
        <div>
          <label htmlFor="maxUses" className={cn(labelCls, "block")}>{t("promo.maxUses")}</label>
          <input id="maxUses" name="maxUses" type="number" min={1} inputMode="numeric" placeholder="∞" className={cn(input, "mt-1.5 w-28")} />
          <p className="mt-1 text-xs text-amber-600">{t("promo.maxUsesHint")}</p>
        </div>
        <Duration label={t("promo.validFor")} hint={t("promo.validForHint")} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>{t("promo.create")}</Button>
        <Result state={state} />
      </div>
    </form>
  );
}

export interface PromoItem {
  id: string;
  code: string;
  kind: "percent" | "amount" | "free";
  value: number;
  recipeCount: number;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  active: boolean;
  status: "live" | "paused" | "expired" | "usedUp";
}

/** The creator's codes with how often each was used, and controls to pause, copy or delete. */
export function PromoList({ items }: { items: PromoItem[] }) {
  const t = useT();
  const locale = useLocale();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  if (items.length === 0) return <p className="px-6 py-10 text-center text-amber-600">{t("promo.noneYet")}</p>;

  return (
    <ul className="divide-y divide-amber-200">
      {items.map((p) => {
        const status = p.status;
        return (
          <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-semibold tracking-wider text-amber-950">{p.code}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", status === "live" ? "bg-sage-100 text-sage-700" : "bg-amber-200 text-amber-800")}>{t(`promo.status.${status}`)}</span>
              </p>
              <p className="mt-1 text-sm text-amber-600">
                {p.kind === "free" ? t("promo.kind.free") : p.kind === "percent" ? `−${p.value}%` : `−${formatPrice(p.value, "UZS", t)}`}
                {" · "}
                {p.recipeCount === 0 ? t("promo.allRecipes") : t("promo.recipesCount", { count: p.recipeCount })}
                {" · "}
                {t("promo.used", { used: p.uses, max: p.maxUses ?? "∞" })}
                {p.expiresAt && <> · {t("promo.until", { date: formatDate(new Date(p.expiresAt), locale) })}</>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(p.code);
                    setCopied(p.id);
                  } catch {
                    // Clipboard blocked; the code is on screen.
                  }
                }}
              >
                {copied === p.id ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied === p.id ? t("share.copied") : t("promo.copy")}
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => start(() => togglePromo(p.id, !p.active))}>
                {p.active ? t("promo.pause") : t("promo.resume")}
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={pending} aria-label={t("promo.delete", { code: p.code })} onClick={() => start(() => removePromo(p.id))} className="text-red-700">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
