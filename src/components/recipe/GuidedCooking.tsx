"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StepTimer } from "@/components/recipe/StepTimer";
import { finishCookingSession, startCookingSession } from "@/app/recipes/actions";
import type { Recipe } from "@/types/recipe";

export function GuidedCooking({ recipe, isLoggedIn }: { recipe: Recipe; isLoggedIn: boolean }) {
  const [index, setIndex] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const sessionId = React.useRef<Promise<string | null> | null>(null);
  const total = recipe.steps.length;

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
  const step = recipe.steps[index];

  const next = React.useCallback(() => {
    if (index === total - 1) {
      setFinished(true);
      ensureSession()?.then((id) => {
          if (id) return finishCookingSession(id);
        }).catch(() => undefined);
    }
    else setIndex((i) => i + 1);
  }, [index, total, ensureSession]);
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
          Premium retseptlar uchun qadam-baqadam rejim pullik versiyaga kiradi. To‘lov tizimi hozircha ulanmagan,
          shuning uchun bu retseptni ochib bo‘lmaydi.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href={`/recipes/${recipe.slug}`}>Retseptga qaytish</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">Bepul retseptlarni ko‘rish</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-amber-950">Yoqimli ishtaha!</h1>
        <p className="mt-4 text-amber-800">{recipe.title}: barcha {total} qadam bajarildi.</p>
        {!isLoggedIn && (
          <p className="mt-2 text-sm text-amber-700">
            <Link href="/auth/signup" className="underline">Hisob yarating</Link> va pishirgan taomlaringiz tarixini saqlang.
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => { sessionId.current = null; setIndex(0); setFinished(false); ensureSession(); }}>Qayta pishirish</Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">Boshqa retseptlar</Link>
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
          Chiqish
        </Link>
        <span>{recipe.title}</span>
      </div>
      <div
        className="mt-4 h-1.5 w-full bg-amber-100"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="Pishirish jarayoni"
      >
        <div className="h-full bg-amber-700 transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-amber-700">
        Qadam {index + 1} / {total}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-serif font-medium text-amber-950 break-words">{step.title}</h1>

      {step.mediaUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden bg-amber-100">
          <Image src={step.mediaUrl} alt={step.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
        </div>
      )}

      <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-amber-950">{step.instruction}</p>
      {step.temperatureCelsius && (
        <p className="mt-3 text-amber-700">Harorat: {step.temperatureCelsius}°C</p>
      )}

      {stepIngredients.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-amber-800" aria-label="Shu qadam uchun masalliqlar">
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

      {step.tip && <p className="mt-6 border-l-2 border-amber-600 pl-4 text-amber-800">Maslahat: {step.tip}</p>}

      <div className="mt-10 flex gap-3">
        <Button size="xl" variant="outline" onClick={prev} disabled={index === 0} className="flex-1 sm:flex-none">
          Orqaga
        </Button>
        <Button size="xl" onClick={next} className="flex-[2] sm:flex-none sm:min-w-48">
          {index === total - 1 ? "Tugatish" : "Keyingi"}
        </Button>
      </div>
    </div>
  );
}
