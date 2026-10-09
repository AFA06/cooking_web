"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StepTimer } from "@/components/recipe/StepTimer";
import { finishCookingSession, startCookingSession } from "@/app/recipes/actions";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { scaleQuantity } from "@/lib/scaling";
import type { Recipe } from "@/types/recipe";

export function GuidedCooking({ recipe, isLoggedIn, servings }: { recipe: Recipe; isLoggedIn: boolean; servings: number }) {
  const factor = servings / recipe.servings;
  const [index, setIndex] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  /** True once the finished session is stored, which is what makes a review allowed. */
  const [recorded, setRecorded] = React.useState(false);
  const [reviewed, setReviewed] = React.useState(false);
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
          if (id) return finishCookingSession(id).then(() => setRecorded(true));
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
        <p className="mt-4 text-amber-900">
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
      <div className="mx-auto max-w-xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Tayyor!</p>
        <h1 className="mt-3 text-4xl font-medium leading-tight text-amber-950 sm:text-5xl">Siz buni pishirdingiz.</h1>
        <p className="mt-3 text-lg text-amber-900">
          {recipe.title} — barcha {total} qadam bajarildi. Yoqimli ishtaha!
        </p>

        {isLoggedIn ? (
          <div className="mt-9 rounded-[1.75rem] bg-amber-100 p-6 sm:p-8">
            {reviewed ? (
              <p role="status" className="font-medium text-sage-700">Rahmat! Bahoyingiz saqlandi va ijodkor sahifasida ko‘rinadi.</p>
            ) : (
              <>
                <h2 className="text-2xl font-medium text-amber-950">Qanday chiqdi?</h2>
                <p className="mb-5 mt-1 text-amber-900">Baho bering, natija rasmini qo‘shing — boshqa oshpazlarga yordam beradi.</p>
                {recorded ? <ReviewForm recipeId={recipe.id} onDone={() => setReviewed(true)} /> : <p className="text-amber-600">Pishirish natijasi saqlanmoqda…</p>}
              </>
            )}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-sage-50 px-5 py-4 text-sage-900">
            <Link href={`/auth/signup?next=${encodeURIComponent(`/recipes/${recipe.slug}`)}`} className="font-medium underline underline-offset-4">Hisob yarating</Link>
            {" "}— pishirgan taomlaringiz tarixi saqlanadi va retseptlarni baholay olasiz.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={`/recipes/${recipe.slug}`}>Retseptga qaytish</Link>
          </Button>
          <Button variant="ghost" asChild>
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
        <span>
          {recipe.title} · {servings} kishilik
        </span>
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
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-amber-900" aria-label="Shu qadam uchun masalliqlar">
          {stepIngredients.map((i) => (
            <li key={i.id}>
              <span className="font-medium">{scaleQuantity(i.quantity, i.unit, factor)} {i.unit}</span> {i.name}
            </li>
          ))}
        </ul>
      )}

      {factor !== 1 && (
        <p className="mt-4 text-sm text-amber-600">
          Miqdorlar {servings} kishiga hisoblangan. Matndagi sonlar va taymer asl retsept ({recipe.servings} kishilik) bo‘yicha — idish kattaligiga qarab vaqtni moslang.
        </p>
      )}

      {step.timerSeconds ? (
        <div className="mt-6">
          <StepTimer key={step.id} seconds={step.timerSeconds} />
        </div>
      ) : null}

      {step.tip && <p className="mt-6 border-l-2 border-amber-600 pl-4 text-amber-900">Maslahat: {step.tip}</p>}

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
