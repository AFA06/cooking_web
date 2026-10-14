"use client";

import * as React from "react";

export interface TimerState {
  /** Length of the timer, including any minutes added while cooking. */
  total: number;
  /** Seconds left while paused or finished. Ignored while running (see endAt). */
  remaining: number;
  /** When it will ring, or null when it is not running. Using a timestamp keeps it exact in a background tab. */
  endAt: number | null;
}

export interface TimerView extends TimerState {
  left: number;
  running: boolean;
  finished: boolean;
  untouched: boolean;
}

interface StepLike {
  id: string;
  timerSeconds?: number;
}

/** One timer per step that has one. They keep running when the cook moves on to the next stage. */
export function useCookTimers(steps: StepLike[], onFinished: (stepId: string) => void) {
  const [timers, setTimers] = React.useState<Record<string, TimerState>>(() =>
    Object.fromEntries(steps.filter((s) => s.timerSeconds).map((s) => [s.id, { total: s.timerSeconds!, remaining: s.timerSeconds!, endAt: null }])),
  );
  const [now, setNow] = React.useState(() => Date.now());
  const ref = React.useRef(timers);
  const callback = React.useRef(onFinished);
  React.useEffect(() => {
    callback.current = onFinished;
  });

  const commit = React.useCallback((next: Record<string, TimerState>) => {
    ref.current = next;
    setTimers(next);
  }, []);

  const anyRunning = Object.values(timers).some((t) => t.endAt !== null);
  React.useEffect(() => {
    if (!anyRunning) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      const done = Object.entries(ref.current).filter(([, t]) => t.endAt !== null && t.endAt <= current);
      if (done.length === 0) return;
      const next = { ...ref.current };
      for (const [stepId, t] of done) next[stepId] = { ...t, remaining: 0, endAt: null };
      commit(next);
      for (const [stepId] of done) callback.current(stepId);
    }, 250);
    return () => window.clearInterval(id);
  }, [anyRunning, commit]);

  const secondsLeft = (t: TimerState) => (t.endAt === null ? t.remaining : Math.max(0, Math.ceil((t.endAt - now) / 1000)));

  const view = (stepId: string): TimerView | null => {
    const t = timers[stepId];
    if (!t) return null;
    const left = secondsLeft(t);
    const running = t.endAt !== null;
    return { ...t, left, running, finished: !running && t.remaining === 0, untouched: !running && t.remaining === t.total };
  };

  const patch = (stepId: string, change: (t: TimerState) => TimerState) => {
    const t = ref.current[stepId];
    if (t) commit({ ...ref.current, [stepId]: change(t) });
  };

  return {
    view,
    anyRunning,
    runningIds: Object.entries(timers).filter(([, t]) => t.endAt !== null).map(([id]) => id),
    secondsLeft: (stepId: string) => (timers[stepId] ? secondsLeft(timers[stepId]) : 0),
    start: (stepId: string) =>
      patch(stepId, (t) => {
        const seconds = t.remaining > 0 ? t.remaining : t.total;
        return { ...t, remaining: seconds, endAt: Date.now() + seconds * 1000 };
      }),
    pause: (stepId: string) => patch(stepId, (t) => ({ ...t, remaining: t.endAt === null ? t.remaining : Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)), endAt: null })),
    reset: (stepId: string) => patch(stepId, (t) => ({ ...t, remaining: t.total, endAt: null })),
    add: (stepId: string, seconds: number) =>
      patch(stepId, (t) =>
        t.endAt === null
          ? { ...t, total: t.total + seconds, remaining: t.remaining + seconds }
          : { ...t, total: t.total + seconds, endAt: t.endAt + seconds * 1000 },
      ),
  };
}
