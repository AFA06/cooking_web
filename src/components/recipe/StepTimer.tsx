"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { formatClock } from "@/lib/format";

export function StepTimer({ seconds, dark = false }: { seconds: number; dark?: boolean }) {
  const [remaining, setRemaining] = React.useState(seconds);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const done = remaining === 0;
  const untouched = remaining === seconds && !running;

  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 border-y py-4 ${dark ? "border-white/20" : "border-amber-200"}`}>
      <span className="font-mono text-4xl sm:text-5xl tabular-nums" role="timer" aria-label={`Taymer ${formatClock(remaining)}`}>
        {formatClock(remaining)}
      </span>
      <div className="flex gap-2">
        <Button size="md" variant={running ? "outline" : "primary"} onClick={() => setRunning((r) => !r)} disabled={done}
          className={dark && running ? "border-white/50 text-white hover:bg-white/10" : ""}>
          {done ? "Vaqt tugadi" : running ? "To‘xtatish" : untouched ? "Taymerni boshlash" : "Davom etish"}
        </Button>
        <Button size="md" variant="ghost" className={dark ? "text-white hover:bg-white/10" : ""}
          onClick={() => { setRunning(false); setRemaining(seconds); }}>
          Qayta
        </Button>
      </div>
      {done && <span role="status" className="font-medium">Taymer tugadi</span>}
    </div>
  );
}
