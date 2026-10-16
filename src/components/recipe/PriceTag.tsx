"use client";

import { useT } from "@/i18n/client";
import { formatPrice } from "@/lib/format";
import { currentPrice, timeLeft, type PriceInput } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Sale colours: the old price in red and struck through, the new one in green right under it. */
const TONES = {
  /** On the cream badges and cards. */
  light: { old: "text-[#b3261e]", now: "text-[#1d7a43]", plain: "" },
  /** On the dark page. */
  dark: { old: "text-[#f0897a]", now: "text-[#93d3a2]", plain: "" },
} as const;

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
  const now = currentPrice({ price, salePrice, saleEndsAt });
  if (!now) return null;
  const c = TONES[tone];
  const sizes = {
    sm: { old: "text-[0.7rem]", now: "text-[0.85rem]" },
    md: { old: "text-sm", now: "text-xl font-serif" },
    lg: { old: "text-lg", now: "text-4xl font-serif" },
  }[size];

  if (now.original === null) return <span className={cn("font-semibold", c.plain, size === "lg" && "font-serif text-4xl", className)}>{formatPrice(now.price, currency, t)}</span>;

  const left = now.endsAt ? timeLeft(now.endsAt) : null;
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
          {left && (
            <span suppressHydrationWarning className="opacity-80">
              {left.days > 0 ? t("price.leftDays", { d: left.days, h: left.hours }) : t("price.leftHours", { h: left.hours, m: left.minutes })}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
