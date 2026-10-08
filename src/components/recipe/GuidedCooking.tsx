"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatClock } from "@/lib/format";
import type { Recipe } from "@/types/recipe";

function StepTimer({ seconds }: { seconds: number }) {
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

  return (
    <div className="flex items-center gap-4 border-y border-amber-200 py-4">
      <span
        className="font-mono text-4xl sm:text-5xl tabular-nums text-amber-950"
        role="timer"
        aria-live="off"
        aria-label={`Timer ${formatClock(remaining)}`}
      >
        {formatClock(remaining)}
      </span>
      <div className="flex gap-2">
        <Button
          size="md"
          variant={running ? "outline" : "primary"}
          onClick={() => setRunning((r) => !r)}
          disabled={done}
        >
          {done ? "Time's up" : running ? "Pause" : remaining === seconds ? "Start timer" : "Resume"}
        </Button>
        <Button
          size="md"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setRemaining(seconds);
          }}
        >
          Reset
        </Button>
      </div>
      {done && <span role="status" className="text-amber-800 font-medium">Timer finished</span>}
    </div>
  );
}

export function GuidedCooking({ recipe }: { recipe: Recipe }) {
  const [index, setIndex] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const total = recipe.steps.length;
  const step = recipe.steps[index];

  const next = React.useCallback(() => {
    if (index === total - 1) setFinished(true);
    else setIndex((i) => i + 1);
  }, [index, total]);
  const prev = React.useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, finished]);

  if (recipe.isPremium) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-serif text-amber-950">{recipe.title}</h1>
        <p className="mt-4 text-amber-800">
          Guided cooking for premium recipes is part of the paid version. Purchasing is not available yet, so this
          recipe cannot be unlocked at the moment.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href={`/recipes/${recipe.slug}`}>Back to recipe</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">Browse free recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-amber-950">Enjoy your {recipe.title}</h1>
        <p className="mt-4 text-amber-800">You completed all {total} steps.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => { setIndex(0); setFinished(false); }}>Cook again</Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">More recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stepIngredients = recipe.ingredients.filter((i) => step.ingredientIds?.includes(i.id));

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-4 text-sm text-amber-700">
        <Link href={`/recipes/${recipe.slug}`} className="underline-offset-2 hover:underline">
          Exit cooking
        </Link>
        <span>{recipe.title}</span>
      </div>
      <div
        className="mt-4 h-1.5 w-full bg-amber-100"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="Cooking progress"
      >
        <div className="h-full bg-amber-700 transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-amber-700">
        Step {index + 1} / {total}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-serif font-medium text-amber-950 break-words">{step.title}</h1>

      {step.mediaUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden bg-amber-100">
          <Image src={step.mediaUrl} alt={step.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
        </div>
      )}

      <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-amber-950">{step.instruction}</p>
      {step.temperatureCelsius && (
        <p className="mt-3 text-amber-700">Temperature: {step.temperatureCelsius}°C</p>
      )}

      {stepIngredients.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-amber-800" aria-label="Ingredients for this step">
          {stepIngredients.map((i) => (
            <li key={i.id}>
              <span className="font-medium">{i.quantity} {i.unit}</span> {i.name}
            </li>
          ))}
        </ul>
      )}

      {step.timerSeconds ? (
        <div className="mt-6">
          <StepTimer key={step.id} seconds={step.timerSeconds} />
        </div>
      ) : null}

      {step.tip && <p className="mt-6 border-l-2 border-amber-600 pl-4 text-amber-800">Tip: {step.tip}</p>}

      <div className="mt-10 flex gap-3">
        <Button size="xl" variant="outline" onClick={prev} disabled={index === 0} className="flex-1 sm:flex-none">
          Back
        </Button>
        <Button size="xl" onClick={next} className="flex-[2] sm:flex-none sm:min-w-48">
          {index === total - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
