"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TimerView } from "@/components/recipe/cooking/useCookTimers";

interface Props {
  timer: TimerView;
  big: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdd: (seconds: number) => void;
}

const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The stage timer as a ring that empties as time passes. Big digits in the middle, one large
 * button underneath: start, pause or resume. A finished timer glows and breathes.
 */
export function TimerRing({ timer, big, onStart, onPause, onReset, onAdd }: Props) {
  const t = useT();
  const progress = timer.total > 0 ? Math.min(1, timer.left / timer.total) : 0;
  const warn = timer.running && timer.left <= 10 && !timer.finished;

  const action = timer.running ? onPause : onStart;
  const label = timer.finished ? t("timer.start") : timer.running ? t("timer.stop") : timer.untouched ? t("timer.start") : t("timer.resume");
  const Icon = timer.running ? Pause : timer.finished ? RotateCcw : Play;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={cn("relative aspect-square w-full", big ? "max-w-[22rem]" : "max-w-[19rem]", timer.finished && "timer-alarm")}>
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="100" cy="100" r={RADIUS} fill="none" strokeWidth="12" className="stroke-amber-200" />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - (timer.finished ? 1 : progress))}
            className={cn("transition-[stroke-dashoffset] duration-300 ease-linear", timer.finished || warn ? "stroke-amber-700" : timer.running ? "stroke-sage-500" : "stroke-amber-500")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            role="timer"
            aria-label={t("timer.label", { time: formatClock(timer.left) })}
            className={cn("font-mono font-medium tabular-nums leading-none text-amber-950", big ? "text-7xl sm:text-8xl" : "text-6xl sm:text-7xl", warn && "text-amber-700")}
          >
            {formatClock(timer.left)}
          </span>
          <span className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-amber-600" aria-live="polite">
            {timer.finished ? t("cook.timeUp") : timer.running ? t("cook.timerRunning") : t("cook.timerFor")}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={action}
        className={cn(
          "flex w-full max-w-xs items-center justify-center gap-3 rounded-full text-xl font-semibold transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50",
          big ? "h-20" : "h-16",
          timer.running ? "border-2 border-amber-950 text-amber-950" : "bg-amber-700 text-amber-50 hover:bg-amber-800",
        )}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
        {label}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {([60, 300] as const).map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => onAdd(seconds)}
            className="h-12 rounded-full border border-amber-300 px-5 text-base font-medium text-amber-950 transition-colors hover:border-amber-950"
          >
            {seconds === 60 ? t("cook.addMinute") : t("cook.addFive")}
          </button>
        ))}
        {!timer.untouched && (
          <button
            type="button"
            onClick={onReset}
            className="flex h-12 items-center gap-2 rounded-full px-4 text-base font-medium text-amber-600 transition-colors hover:text-amber-950"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("timer.reset")}
          </button>
        )}
      </div>
    </div>
  );
}
