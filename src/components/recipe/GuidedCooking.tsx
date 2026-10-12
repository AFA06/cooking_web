"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, BellRing, Check, Clock, ListChecks, Sun, Thermometer, Type, X } from "lucide-react";
import { finishCookingSession, startCookingSession } from "@/app/recipes/actions";
import { StageRail } from "@/components/recipe/cooking/StageRail";
import { TimerRing } from "@/components/recipe/cooking/TimerRing";
import { useCookTimers } from "@/components/recipe/cooking/useCookTimers";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { formatClock } from "@/lib/format";
import { scaleQuantity } from "@/lib/scaling";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

/* ───────────── text size, remembered on this device ───────────── */

type TextSize = "l" | "xl";
const SIZE_KEY = "cook-text-size";
const SIZE_EVENT = "cook-text-size-change";
const subscribeSize = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(SIZE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(SIZE_EVENT, notify);
  };
};
const readSize = (): TextSize => {
  try {
    return window.localStorage.getItem(SIZE_KEY) === "xl" ? "xl" : "l";
  } catch {
    return "l";
  }
};
function writeSize(size: TextSize) {
  try {
    window.localStorage.setItem(SIZE_KEY, size);
  } catch {
    // Private mode: the choice simply lasts until the page is closed.
  }
  window.dispatchEvent(new Event(SIZE_EVENT));
}

/* ───────────── a small finished-dish celebration ───────────── */

const CONFETTI = ["bg-amber-700", "bg-sage-500", "bg-amber-800", "bg-amber-900", "bg-clay-400"];

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className={cn("confetti absolute top-0 block h-3 w-2 rounded-[2px]", CONFETTI[i % CONFETTI.length])}
          style={
            {
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 9) * 0.12}s`,
              "--fall": `${3 + (i % 5) * 0.45}s`,
              "--drift": `${((i % 9) - 4) * 26}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ───────────── the cooking screen ───────────── */

export function GuidedCooking({ recipe, isLoggedIn, servings }: { recipe: Recipe; isLoggedIn: boolean; servings: number }) {
  const t = useT();
  const factor = servings / recipe.servings;
  const total = recipe.steps.length;

  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<"next" | "prev">("next");
  const [finished, setFinished] = React.useState(false);
  /** True once the finished session is stored, which is what makes a review allowed. */
  const [recorded, setRecorded] = React.useState(false);
  const [reviewed, setReviewed] = React.useState(false);
  const [ringing, setRinging] = React.useState<string[]>([]);
  const [overviewOpen, setOverviewOpen] = React.useState(false);
  const [awake, setAwake] = React.useState(false);
  const sessionId = React.useRef<Promise<string | null> | null>(null);
  const audio = React.useRef<AudioContext | null>(null);
  const touch = React.useRef<{ x: number; y: number } | null>(null);

  const size = React.useSyncExternalStore(subscribeSize, readSize, () => "l" as TextSize);
  const big = size === "xl";

  /* — sound, vibration and the title bar tell you a timer rang, even from across the room — */
  const unlockSound = React.useCallback(() => {
    if (!audio.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audio.current = new Ctor();
    }
    void audio.current?.resume();
  }, []);

  const alarm = React.useCallback((stepId: string) => {
    setRinging((current) => (current.includes(stepId) ? current : [...current, stepId]));
    const ctx = audio.current;
    if (ctx) {
      [0, 0.32, 0.64, 1.1, 1.42, 1.74].forEach((at) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + at);
        osc.stop(ctx.currentTime + at + 0.25);
      });
    }
    navigator.vibrate?.([350, 150, 350, 150, 700]);
  }, []);

  const timers = useCookTimers(recipe.steps, alarm);

  const ensureSession = React.useCallback(() => {
    if (!isLoggedIn || recipe.isPremium) return null;
    if (!sessionId.current) {
      sessionId.current = startCookingSession(recipe.id)
        .then((r) => r?.sessionId ?? null)
        .catch(() => null);
    }
    return sessionId.current;
  }, [isLoggedIn, recipe.id, recipe.isPremium]);

  React.useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  /* — keep the screen on: nobody wants it dark while their hands are in dough — */
  React.useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        if (!("wakeLock" in navigator)) return;
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) return void lock.release();
        setAwake(true);
        lock.addEventListener("release", () => setAwake(false));
      } catch {
        // Not allowed (low battery, background tab): cooking works the same without it.
      }
    };
    void request();
    const onVisible = () => document.visibilityState === "visible" && void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, []);

  /* — the browser tab shows the nearest timer — */
  const runningIds = timers.runningIds;
  const nearest = runningIds.length > 0 ? Math.min(...runningIds.map((id) => timers.secondsLeft(id))) : null;
  React.useEffect(() => {
    if (nearest === null) return;
    const original = document.title;
    document.title = `⏱ ${formatClock(nearest)} · ${recipe.title}`;
    return () => {
      document.title = original;
    };
  }, [nearest, recipe.title]);

  /* — moving between stages — */
  const finish = React.useCallback(() => {
    setFinished(true);
    ensureSession()
      ?.then((id) => {
        if (id) return finishCookingSession(id).then(() => setRecorded(true));
      })
      .catch(() => undefined);
  }, [ensureSession]);

  const goTo = React.useCallback(
    (target: number) => {
      if (target === index || target < 0 || target >= total) return;
      setDirection(target > index ? "next" : "prev");
      setIndex(target);
      setRinging((current) => current.filter((id) => id !== recipe.steps[target].id));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [index, total, recipe.steps],
  );

  const next = React.useCallback(() => {
    unlockSound();
    if (index === total - 1) finish();
    else goTo(index + 1);
  }, [index, total, finish, goTo, unlockSound]);
  const prev = React.useCallback(() => goTo(index - 1), [goTo, index]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || overviewOpen) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, finished, overviewOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) (dx < 0 ? next : prev)();
  };

  /* ───────────── premium recipes are not cookable yet ───────────── */
  if (recipe.isPremium) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-serif text-4xl text-amber-950">{recipe.title}</h1>
        <p className="mt-5 text-xl leading-relaxed text-amber-900">{t("cook.premiumLocked")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="xl" asChild>
            <Link href={`/recipes/${recipe.slug}`}>{t("cook.backToRecipe")}</Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/recipes">{t("cook.freeRecipes")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ───────────── all done ───────────── */
  if (finished) {
    return (
      <div className="relative min-h-dvh">
        <Confetti />
        <div className="relative z-10 mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
          <span className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-sage-500">
            <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="#2c2825" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="draw-check" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-clay-400">{t("cook.celebrate")}</p>
          <h1 className="mt-3 font-serif text-5xl font-medium leading-tight text-amber-950 sm:text-6xl">{t("cook.youCooked")}</h1>
          <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-amber-900">{t("cook.allStepsDone", { title: recipe.title, total, count: total })}</p>

          {isLoggedIn ? (
            <div className="mt-10 rounded-[1.75rem] bg-amber-100 p-6 text-left sm:p-8">
              {reviewed ? (
                <p role="status" className="text-lg font-medium text-sage-700">{t("cook.thanks")}</p>
              ) : (
                <>
                  <h2 className="text-2xl font-medium text-amber-950">{t("cook.howDidItGo")}</h2>
                  <p className="mb-5 mt-1 text-lg text-amber-900">{t("cook.rateInvite")}</p>
                  {recorded ? <ReviewForm recipeId={recipe.id} onDone={() => setReviewed(true)} /> : <p className="text-amber-600">{t("cook.saving")}</p>}
                </>
              )}
            </div>
          ) : (
            <p className="mt-10 rounded-2xl bg-sage-50 px-5 py-4 text-lg text-sage-900">
              <Link href={`/auth/signup?next=${encodeURIComponent(`/recipes/${recipe.slug}`)}`} className="font-semibold underline underline-offset-4">{t("cook.createAccount")}</Link>{" "}
              {t("cook.createAccountNote")}
            </p>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="xl" variant="outline" asChild>
              <Link href={`/recipes/${recipe.slug}`}>{t("cook.backToRecipe")}</Link>
            </Button>
            <Button size="xl" variant="ghost" asChild>
              <Link href="/recipes">{t("cook.otherRecipes")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────── a stage ───────────── */
  const step = recipe.steps[index];
  const nextStep = recipe.steps[index + 1];
  const stepIngredients = recipe.ingredients.filter((i) => step.ingredientIds?.includes(i.id));
  const timer = timers.view(step.id);
  const ringingElsewhere = ringing.filter((id) => id !== step.id);
  const tickingElsewhere = runningIds.filter((id) => id !== step.id);
  const indexOf = (id: string) => recipe.steps.findIndex((s) => s.id === id);

  return (
    <div className="flex min-h-dvh flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full px-3 text-base font-medium text-amber-900 transition-colors hover:bg-amber-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("cook.exit")}</span>
            <span className="sr-only sm:hidden">{t("cook.exit")}</span>
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-base font-medium text-amber-950 sm:text-lg">
            {recipe.title}
            <span className="ml-2 hidden text-amber-600 sm:inline">· {servings} {t("servings.unit")}</span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {awake && (
              <span title={t("cook.screenOn")} className="hidden h-12 w-12 items-center justify-center text-sage-600 md:flex">
                <Sun className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{t("cook.screenOn")}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => writeSize(big ? "l" : "xl")}
              aria-pressed={big}
              aria-label={big ? t("cook.textNormal") : t("cook.textLarger")}
              title={t("cook.textSize")}
              className={cn("flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-amber-100", big ? "bg-amber-100 text-amber-700" : "text-amber-900")}
            >
              <Type className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setOverviewOpen(true)}
              aria-label={t("cook.overview")}
              className="flex h-12 w-12 items-center justify-center rounded-full text-amber-900 transition-colors hover:bg-amber-100"
            >
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
          <StageRail
            steps={recipe.steps.map((s) => ({ id: s.id, title: s.title, hasTimer: !!s.timerSeconds }))}
            index={index}
            coverUrl={recipe.coverMedia.url}
            runningIds={runningIds}
            onJump={goTo}
          />
        </div>
      </header>

      {/* timers from other stages */}
      {(ringingElsewhere.length > 0 || tickingElsewhere.length > 0) && (
        <div className="mx-auto w-full max-w-6xl space-y-2 px-4 pt-4 sm:px-6">
          {ringingElsewhere.map((id) => (
            <div key={id} role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-700 px-5 py-4 text-amber-50">
              <BellRing className="h-6 w-6 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-lg font-semibold">{t("cook.alertedOther", { title: recipe.steps[indexOf(id)]?.title ?? "" })}</p>
              <button type="button" onClick={() => goTo(indexOf(id))} className="h-11 rounded-full bg-amber-50 px-5 text-base font-semibold text-amber-950">
                {t("cook.goThere")}
              </button>
              <button type="button" onClick={() => setRinging((c) => c.filter((x) => x !== id))} aria-label={t("common.close")} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-amber-800">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ))}
          {tickingElsewhere
            .filter((id) => !ringingElsewhere.includes(id))
            .map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => goTo(indexOf(id))}
                className="flex w-full items-center gap-3 rounded-2xl bg-sage-50 px-5 py-3 text-left text-base text-sage-900 transition-colors hover:bg-sage-100"
              >
                <Clock className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  {t("cook.stage", { n: indexOf(id) + 1 })} · {recipe.steps[indexOf(id)]?.title}
                </span>
                <span className="font-mono text-lg font-medium tabular-nums">{formatClock(timers.secondsLeft(id))}</span>
              </button>
            ))}
        </div>
      )}

      {/* the stage */}
      <main className="flex-1 overflow-x-clip">
        <div key={index} className={cn(
            direction === "next" ? "stage-next" : "stage-prev",
            "mx-auto grid max-w-6xl gap-x-16 gap-y-8 px-5 pb-40 pt-8 sm:px-6",
            timer && "lg:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)]",
          )}>
          {/* what to do */}
          <div className="min-w-0">
            <div className="flex items-end gap-4 sm:gap-6">
              <span className="stage-number font-serif text-8xl font-medium leading-[0.8] text-clay-400 sm:text-9xl" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="pb-1 text-base font-semibold uppercase tracking-[0.16em] text-amber-600 sm:text-lg">
                {t("cook.stageOf", { n: index + 1, total })}
              </p>
            </div>

            <h1 className={cn("mt-6 break-words font-serif font-medium leading-[1.08] text-amber-950", big ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl lg:text-5xl")}>{step.title}</h1>

            {step.mediaUrl && (
              <div className="relative mt-7 aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-3xl bg-amber-100">
                <Image src={step.mediaUrl} alt={step.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
              </div>
            )}

            <p className={cn("mt-7 max-w-3xl leading-[1.55] text-amber-950", big ? "text-3xl sm:text-4xl lg:text-[2.75rem]" : "text-2xl sm:text-3xl lg:text-4xl")}>{step.instruction}</p>

            {step.temperatureCelsius ? (
              <p className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-clay-100 px-5 py-3 text-2xl font-semibold text-amber-950">
                <Thermometer className="h-7 w-7 text-amber-700" aria-hidden="true" />
                {step.temperatureCelsius}°C
              </p>
            ) : null}
          </div>

          {/* the timer */}
          {timer && (
            <aside className="min-w-0 self-start rounded-[2rem] bg-amber-100 px-5 py-8 sm:px-8 lg:sticky lg:top-44 lg:row-span-2" aria-label={t("cook.timerFor")}>
              <TimerRing
                timer={timer}
                big={big}
                onStart={() => {
                  unlockSound();
                  setRinging((c) => c.filter((id) => id !== step.id));
                  timers.start(step.id);
                }}
                onPause={() => timers.pause(step.id)}
                onReset={() => {
                  setRinging((c) => c.filter((id) => id !== step.id));
                  timers.reset(step.id);
                }}
                onAdd={(seconds) => timers.add(step.id, seconds)}
              />
              {timer.finished && (
                <p role="alert" className="mt-6 rounded-2xl bg-amber-700 px-5 py-4 text-center text-lg font-semibold text-amber-50">
                  {t("cook.timeUp")} {t("cook.timeUpNote")}
                </p>
              )}
            </aside>
          )}

          {/* what you need */}
          <div className="min-w-0 space-y-6">
            {stepIngredients.length > 0 && (
              <section aria-label={t("servings.stepIngredients")}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">{t("cook.ingredientsNow")}</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {stepIngredients.map((i) => (
                    <li key={i.id} className="flex items-baseline gap-3 rounded-2xl bg-sage-50 px-5 py-4">
                      <span className={cn("shrink-0 font-serif font-semibold tabular-nums text-sage-700", big ? "text-4xl" : "text-3xl")}>
                        {scaleQuantity(i.quantity, i.unit, factor)}
                        <span className="ml-1 text-xl font-normal text-sage-600">{i.unit}</span>
                      </span>
                      <span className={cn("min-w-0 text-amber-950", big ? "text-2xl" : "text-xl")}>{i.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {step.tip && (
              <aside className="max-w-3xl rounded-2xl border-l-4 border-amber-700 bg-amber-100 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">{t("cook.tipTitle")}</p>
                <p className={cn("mt-1.5 leading-relaxed text-amber-950", big ? "text-2xl" : "text-xl")}>{step.tip}</p>
              </aside>
            )}

            {factor !== 1 && <p className="max-w-3xl text-base leading-relaxed text-amber-600">{t("cook.scaledNote", { servings, base: recipe.servings })}</p>}
          </div>
        </div>
      </main>

      {/* navigation dock */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-200 bg-amber-50/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <p className="mb-2 truncate text-center text-base text-amber-600">
            {nextStep ? t("cook.nextUp", { title: nextStep.title }) : t("cook.lastStage")}
            <span className="ml-3 hidden text-sm text-amber-500 lg:inline">{t("cook.swipeHint")}</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className={cn(
                "flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-amber-300 px-6 text-lg font-semibold text-amber-950 transition-[transform,border-color] hover:border-amber-950 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
                big ? "h-20 w-24 sm:w-40" : "h-16 w-20 sm:w-36",
              )}
              aria-label={t("common.back")}
            >
              <ArrowLeft className="h-6 w-6" aria-hidden="true" />
              <span className="hidden sm:inline">{t("common.back")}</span>
            </button>
            <button
              type="button"
              onClick={next}
              className={cn(
                "flex flex-1 items-center justify-center gap-3 rounded-full bg-amber-700 text-xl font-semibold text-amber-50 shadow-[0_10px_30px_-10px_rgba(200,109,81,0.8)] transition-[transform,background-color] hover:bg-amber-800 active:scale-[0.98]",
                big ? "h-20 text-2xl" : "h-16",
              )}
            >
              {index === total - 1 ? (
                <>
                  <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
                  {t("cook.finish")}
                </>
              ) : (
                <>
                  {t("common.next")}
                  <ArrowRight className="h-6 w-6" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* all stages */}
      <Dialog.Root open={overviewOpen} onOpenChange={setOverviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="rise fixed inset-x-0 bottom-0 z-[60] max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-soft outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[34rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:p-7"
          >
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="font-serif text-3xl font-medium text-amber-950">{t("cook.overview")}</Dialog.Title>
              <Dialog.Close className="flex h-12 w-12 items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-950" aria-label={t("common.close")}>
                <X className="h-6 w-6" aria-hidden="true" />
              </Dialog.Close>
            </div>
            <ol className="mt-4 space-y-2">
              {recipe.steps.map((s, i) => {
                const state = i < index ? "done" : i === index ? "current" : "todo";
                const running = runningIds.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOverviewOpen(false);
                        goTo(i);
                      }}
                      aria-current={state === "current" ? "step" : undefined}
                      className={cn(
                        "flex min-h-16 w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors",
                        state === "current" ? "bg-amber-700 text-amber-50" : "bg-amber-100 text-amber-950 hover:bg-amber-200",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold",
                          state === "done" ? "bg-sage-500 text-amber-50" : state === "current" ? "bg-amber-50 text-amber-700" : "bg-amber-200 text-amber-900",
                        )}
                      >
                        {state === "done" ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-medium leading-snug">{s.title}</span>
                        {(s.timerSeconds || running) && (
                          <span className={cn("mt-0.5 flex items-center gap-1.5 text-sm", state === "current" ? "text-amber-100" : "text-amber-600")}>
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {running ? formatClock(timers.secondsLeft(s.id)) : formatClock(s.timerSeconds ?? 0)}
                          </span>
                        )}
                      </span>
                      <span className={cn("shrink-0 text-sm font-semibold", state === "current" ? "text-amber-50" : "text-amber-600")}>
                        {state === "done" ? t("cook.done") : state === "current" ? t("cook.current") : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
