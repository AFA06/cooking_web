"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatPrice } from "@/lib/format";
import { currentPrice, saleIsActive, type PriceInput } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Sale colours: the old price in red and struck through, the new one in green right under it. */
const TONES = {
  /** On the cream badges and cards. */
  light: { old: "text-[#b3261e]", now: "text-[#1d7a43]", plain: "" },
  /** On the dark page. */
  dark: { old: "text-[#f0897a]", now: "text-[#93d3a2]", plain: "" },
} as const;

/**
 * The current time, ticking every second while a time-limited sale is running, so the countdown moves
 * and the price falls back to normal the moment the sale ends, without a reload.
 */
function useSaleClock(p: PriceInput): number {
  const [now, setNow] = useState(() => Date.now());
  const ticking = !!p.saleEndsAt && saleIsActive(p, now);
  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ticking]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "Tugashiga 00:59:12", or "Tugashiga 2 kun 05:12:09" for longer sales. */
function useCountdownText(endsAt: Date, now: number): string {
  const t = useT();
  const s = Math.max(0, Math.floor((endsAt.getTime() - now) / 1000));
  const days = Math.floor(s / 86_400);
  const time = `${pad(Math.floor((s % 86_400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return days > 0 ? t("price.leftDaysClock", { d: days, time }) : t("price.leftClock", { time });
}

interface Props extends PriceInput {
  currency?: string;
  tone?: keyof typeof TONES;
  size?: "sm" | "md" | "lg";
  /** Show "−30%" and how long the sale has left. */
  details?: boolean;
  className?: string;
}

/** A premium recipe's price. During a sale: old price crossed out in red, new price in green below it. */
export function PriceTag({ price, salePrice, saleEndsAt, currency = "UZS", tone = "light", size = "sm", details = false, className }: Props) {
  const t = useT();
  const clock = useSaleClock({ price, salePrice, saleEndsAt });
  const now = currentPrice({ price, salePrice, saleEndsAt }, clock);
  if (!now) return null;
  const c = TONES[tone];
  const sizes = {
    sm: { old: "text-[0.7rem]", now: "text-[0.85rem]" },
    md: { old: "text-sm", now: "text-xl font-serif" },
    lg: { old: "text-lg", now: "text-4xl font-serif" },
  }[size];

  if (now.original === null) return <span className={cn("font-semibold", c.plain, size === "lg" && "font-serif text-4xl", className)}>{formatPrice(now.price, currency, t)}</span>;

  return (
    <span className={cn("inline-flex flex-col leading-tight", className)}>
      <span className={cn("font-medium line-through decoration-2", c.old, sizes.old)}>
        <span className="sr-only">{t("price.was")} </span>
        {formatPrice(now.original, currency, t)}
      </span>
      <span className={cn("font-bold", c.now, sizes.now)}>
        <span className="sr-only">{t("price.now")} </span>
        {formatPrice(now.price, currency, t)}
      </span>
      {details && (
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#1d7a43] px-2 py-0.5 text-white">−{now.percentOff}%</span>
          {now.endsAt && <Countdown endsAt={now.endsAt} now={clock} className="opacity-80" />}
        </span>
      )}
    </span>
  );
}

function Countdown({ endsAt, now, className }: { endsAt: Date; now: number; className?: string }) {
  const text = useCountdownText(endsAt, now);
  return (
    <span suppressHydrationWarning className={cn("tabular-nums", className)}>
      {text}
    </span>
  );
}

/** A small "sale ends in 00:59:12" pill for recipe cards. Shows nothing unless a time-limited sale is running. */
export function SaleTimer({ price, salePrice, saleEndsAt, className }: PriceInput & { className?: string }) {
  const clock = useSaleClock({ price, salePrice, saleEndsAt });
  const now = currentPrice({ price, salePrice, saleEndsAt }, clock);
  if (!now?.endsAt) return null;
  return (
    <span className={cn("flex items-center gap-1.5 rounded-full bg-[#b3261e]/95 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm", className)}>
      <Timer className="h-3.5 w-3.5" aria-hidden="true" />
      <Countdown endsAt={now.endsAt} now={clock} />
    </span>
  );
}
