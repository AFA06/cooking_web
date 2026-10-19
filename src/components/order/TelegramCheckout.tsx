"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Gift, Send, Ticket, X } from "lucide-react";
import { cancelMyOrder, checkPromoCode, startTelegramOrder, type PromoCheck } from "@/app/orders/actions";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** What the order page needs to know, already formatted on the server. */
export interface OrderView {
  code: string;
  status: "pending" | "paid" | "failed" | "refunded";
  recipeSlug: string;
  recipeTitle: string;
  amountText: string;
  creatorName: string;
  telegramUsername: string | null;
  expiresText: string | null;
}

function openTelegram(link: string) {
  // A new tab keeps this page (and its order status) open; if the browser blocks it, leave the page instead.
  // "noopener" as a window feature makes window.open return null even when the tab opened, which used to
  // send this page to Telegram as well. Open normally, then cut the link back to us.
  const win = window.open(link, "_blank");
  if (win) win.opener = null;
  else window.location.assign(link);
}

/** Order progress: pay the card from the chat, wait for the creator, get access. */
export function OrderStatus({ order, tone = "page" }: { order: OrderView; tone?: "page" | "card" }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const light = tone === "card";
  const muted = light ? "text-amber-700" : "text-amber-600";

  if (order.status === "paid") {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 font-serif text-2xl font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-500 text-ink"><Check className="h-5 w-5" aria-hidden="true" /></span>
          {t("order.status.paid")}
        </p>
        <p className={muted}>{t("order.paidText", { name: order.creatorName })}</p>
        <Button asChild size="lg"><Link href={`/recipes/${order.recipeSlug}/cook`}>{t("order.startCooking")}</Link></Button>
      </div>
    );
  }
  if (order.status !== "pending") {
    return <p className={muted}>{t("order.closed")}</p>;
  }

  const steps = [
    { done: true, title: t("order.step.sent", { name: order.creatorName }), note: null },
    { done: false, title: t("order.step.pay", { name: order.creatorName }), note: t("order.step.payNote") },
    { done: false, title: t("order.step.confirm", { name: order.creatorName }), note: null },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="font-serif text-2xl font-medium">{t("order.status.pending")}</p>
        <p className={cn("mt-1 text-sm", muted)}>
          {order.recipeTitle} · {order.amountText} · <span className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-amber-950">{order.code}</span>
        </p>
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs", s.done ? "border-sage-500 bg-sage-500 text-ink" : i === 1 ? "border-clay-400" : "border-amber-300")}>
              {s.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={i === 1 ? "font-medium" : muted}>
              {s.title}
              {s.note && <span className={cn("block text-sm font-normal", muted)}>{s.note}</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="rounded-2xl bg-clay-100 px-4 py-3 text-sm text-amber-950">{t("order.safety", { name: order.creatorName })}</p>
      <div className="flex flex-wrap gap-3">
        {order.telegramUsername && (
          <Button asChild size="lg" variant="outline">
            <a href={`https://t.me/${order.telegramUsername}`} target="_blank" rel="noopener noreferrer"><Send className="h-4 w-4" aria-hidden="true" />{t("order.openChat")}</a>
          </Button>
        )}
        <Button
          size="lg"
          variant="ghost"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await cancelMyOrder(order.code);
            router.refresh();
            setBusy(false);
          }}
        >
          {t("order.cancel")}
        </Button>
      </div>
      {order.expiresText && <p className={cn("text-sm", muted)}>{t("order.expires", { date: order.expiresText })}</p>}
    </div>
  );
}

interface Props {
  recipeId: string;
  recipeSlug: string;
  isLoggedIn: boolean;
  /** The creator has a Telegram username and the recipe has a price. */
  ready: boolean;
  order: OrderView | null;
  creatorName: string;
  previewPlain: string;
  previewWithContact: string;
  /** "card" sits on the dark paywall card (light button); "page" sits on the normal page (regular button). */
  tone?: "card" | "page";
  /** Full width on phones, for the boxes in the recipe header. */
  wide?: boolean;
}

/** The Buy button for a premium recipe, its confirmation sheet, and the waiting state once an order exists. */
export function TelegramCheckout({ recipeId, recipeSlug, isLoggedIn, ready, order, creatorName, previewPlain, previewWithContact, tone = "card", wide = false }: Props) {
  const t = useT();
  const onCard = tone === "card";
  const trigger = cn(onCard && "bg-amber-50 text-amber-950 hover:bg-amber-100", wide && "w-full sm:w-auto");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [share, setShare] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [promoOpen, setPromoOpen] = React.useState(false);
  const [promoInput, setPromoInput] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [promo, setPromo] = React.useState<Extract<PromoCheck, { ok: true }> | null>(null);

  if (!ready) {
    return (
      <div className={cn(onCard && "sm:text-right")}>
        <Button size="xl" disabled className={trigger}>{t("detail.paymentSoon")}</Button>
        <p className={cn("mt-2 text-sm", onCard ? "text-amber-700" : "text-amber-600")}>{t("order.notReady")}</p>
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <Button asChild size="xl" className={trigger}>
        <Link href={`/auth/signup?next=/recipes/${recipeSlug}`}>{t("order.signInToBuy")}</Link>
      </Button>
    );
  }
  if (order && order.status === "pending") return <div className="w-full sm:max-w-md"><OrderStatus order={order} tone={onCard ? "card" : "page"} /></div>;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setChecking(true);
    setPromoError(null);
    const r = await checkPromoCode(recipeId, promoInput);
    setChecking(false);
    if (r.ok) setPromo(r);
    else {
      setPromo(null);
      setPromoError(r.error);
    }
  };

  const go = async () => {
    setBusy(true);
    setError(null);
    const result = await startTelegramOrder(recipeId, share, promo?.code ?? "");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.link) openTelegram(result.link);
    setOpen(false);
    router.refresh();
  };

  const message = promo ? (share ? promo.previewWithContact : promo.previewPlain) : share ? previewWithContact : previewPlain;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="xl" className={trigger}><Send className="h-5 w-5" aria-hidden="true" />{t("order.buy")}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby="order-note"
          className="rise fixed inset-x-0 bottom-0 z-[60] max-h-[90dvh] overflow-y-auto rounded-t-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-soft outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[28rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem]"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-serif text-2xl font-medium">{promo?.free ? t("order.free.title") : t("order.dialog.title", { name: creatorName })}</Dialog.Title>
            <Dialog.Close className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-950" aria-label={t("common.close")}>
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {promo?.free ? (
            <p id="order-note" className="mt-2 text-amber-900">{t("order.free.note", { code: promo.code, name: creatorName })}</p>
          ) : (
            <>
              <p id="order-note" className="mt-1 text-sm text-amber-600">{t("order.dialog.note")}</p>
              <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-sage-100 p-4 font-sans text-[0.95rem] leading-relaxed text-sage-900">{message}</pre>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-amber-900">
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-clay-400" />
                <span>{t("order.dialog.share", { name: creatorName })}</span>
              </label>
            </>
          )}

          <div className="mt-4 rounded-2xl border border-amber-200 p-4">
            {promo ? (
              <div className="flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-2 text-sm">
                  <Ticket className="h-4 w-4 shrink-0 text-[#93d3a2]" aria-hidden="true" />
                  <span className="font-mono font-semibold">{promo.code}</span>
                  <span className="text-amber-600 line-through">{promo.listText}</span>
                  <span className="font-semibold text-[#93d3a2]">{promo.free ? t("order.free.price") : promo.finalText}</span>
                </p>
                <button type="button" onClick={() => { setPromo(null); setPromoInput(""); }} className="shrink-0 text-sm font-medium text-amber-700 underline">{t("order.promo.remove")}</button>
              </div>
            ) : promoOpen ? (
              <div>
                <label htmlFor="promo" className="text-sm font-medium">{t("order.promo.label")}</label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="promo"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                    maxLength={20}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-amber-300 bg-amber-100 px-3 font-mono uppercase tracking-wider text-amber-950 focus:border-amber-950 focus:outline-none"
                  />
                  <Button type="button" variant="outline" loading={checking} onClick={applyPromo}>{t("order.promo.apply")}</Button>
                </div>
                {promoError && <p role="alert" className="mt-2 text-sm text-red-700">{promoError}</p>}
              </div>
            ) : (
              <button type="button" onClick={() => setPromoOpen(true)} className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <Ticket className="h-4 w-4" aria-hidden="true" />
                {t("order.promo.have")}
              </button>
            )}
          </div>

          {!promo?.free && <p className="mt-3 text-sm text-amber-600">{t("order.dialog.hint", { name: creatorName })}</p>}
          {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
          <Button size="xl" className="mt-5 w-full" loading={busy} onClick={go}>
            {promo?.free ? <Gift className="h-5 w-5" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
            {promo?.free ? t("order.free.get") : t("order.dialog.open")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
