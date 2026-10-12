"use client";

import { Check, Clock } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

interface Props {
  steps: { id: string; title: string; hasTimer: boolean }[];
  index: number;
  coverUrl: string;
  runningIds: string[];
  onJump: (index: number) => void;
}

/**
 * The whole recipe as one path. Finished stages fill in, the current one lights up, and the dish
 * itself — the round cover photo — rides along the path from stage to stage.
 */
export function StageRail({ steps, index, coverUrl, runningIds, onJump }: Props) {
  const t = useT();
  const total = steps.length;
  const center = ((index + 0.5) / total) * 100;

  return (
    <div className="relative pt-9">
      <span
        className="pointer-events-none absolute top-0 z-10 h-8 w-8 -translate-x-1/2 overflow-hidden rounded-full ring-2 ring-amber-700 transition-[left] duration-700 ease-[cubic-bezier(0.3,0.9,0.3,1)]"
        style={{ left: `${center}%` }}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 32px decorative thumbnail */}
        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
      </span>

      <ol className="flex gap-1.5" aria-label={t("cook.progress")}>
        {steps.map((step, i) => {
          const done = i < index;
          const current = i === index;
          const ticking = runningIds.includes(step.id);
          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={current ? "step" : undefined}
                aria-label={t("cook.jumpTo", { n: i + 1, title: step.title })}
                className="group flex h-11 w-full flex-col justify-end outline-none"
              >
                <span
                  className={cn(
                    "relative flex h-3 w-full items-center justify-center overflow-hidden rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-amber-950",
                    done ? "bg-sage-500" : current ? "bg-amber-700" : "bg-amber-200 group-hover:bg-amber-300",
                    current && "h-4",
                  )}
                >
                  {done && total <= 14 && <Check className="h-3 w-3 text-amber-50" strokeWidth={3} aria-hidden="true" />}
                  {ticking && <span className="absolute inset-0 animate-pulse bg-amber-50/30" aria-hidden="true" />}
                </span>
                {step.hasTimer && (
                  <Clock className={cn("mx-auto mt-1 h-3 w-3", current ? "text-amber-700" : done ? "text-sage-600" : "text-amber-500")} aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
