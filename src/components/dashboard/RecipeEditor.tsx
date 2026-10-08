"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { saveRecipe } from "@/app/dashboard/actions";
import type { RecipeInput } from "@/lib/recipe-schema";

type Ingredient = { name: string; quantity: string; unit: string };
type Step = {
  title: string;
  instruction: string;
  mediaUrl: string;
  timerMinutes: string;
  temperatureCelsius: string;
  tip: string;
  ingredientPositions: string;
};

export interface EditorInitial {
  id: string | null;
  title: string;
  description: string;
  coverUrl: string;
  servings: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  difficulty: "easy" | "medium" | "hard";
  isPremium: boolean;
  priceAmount: string;
  tags: string;
  status: "draft" | "published";
  ingredients: Ingredient[];
  steps: Step[];
}

export const EMPTY_RECIPE: EditorInitial = {
  id: null,
  title: "",
  description: "",
  coverUrl: "",
  servings: "4",
  prepTimeMinutes: "15",
  cookTimeMinutes: "30",
  difficulty: "easy",
  isPremium: false,
  priceAmount: "",
  tags: "",
  status: "draft",
  ingredients: [{ name: "", quantity: "", unit: "" }],
  steps: [{ title: "", instruction: "", mediaUrl: "", timerMinutes: "", temperatureCelsius: "", tip: "", ingredientPositions: "" }],
};

const field =
  "w-full min-h-12 px-3 py-2 border border-amber-300 bg-white text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-600";
const label = "block text-sm font-medium text-amber-950";

function toInput(v: EditorInitial): RecipeInput {
  return {
    title: v.title,
    description: v.description,
    coverUrl: v.coverUrl,
    servings: Number(v.servings),
    prepTimeMinutes: Number(v.prepTimeMinutes),
    cookTimeMinutes: Number(v.cookTimeMinutes),
    difficulty: v.difficulty,
    isPremium: v.isPremium,
    priceAmount: v.isPremium && v.priceAmount ? Number(v.priceAmount) : null,
    tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
    ingredients: v.ingredients,
    steps: v.steps.map((s) => ({
      title: s.title,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl,
      timerMinutes: Number(s.timerMinutes || 0),
      temperatureCelsius: Number(s.temperatureCelsius || 0),
      tip: s.tip,
      ingredientPositions: s.ingredientPositions
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isInteger(n) && n > 0),
    })),
  };
}

export function RecipeEditor({ initial }: { initial: EditorInitial }) {
  const router = useRouter();
  const [v, setV] = React.useState<EditorInitial>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const set = <K extends keyof EditorInitial>(key: K, value: EditorInitial[K]) => setV((p) => ({ ...p, [key]: value }));
  const setIngredient = (i: number, patch: Partial<Ingredient>) =>
    set("ingredients", v.ingredients.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const setStep = (i: number, patch: Partial<Step>) => set("steps", v.steps.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const move = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = list.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const submit = (publish: boolean) =>
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const result = await saveRecipe(v.id, toInput(v), publish);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setV((p) => ({ ...p, id: result.id, status: publish ? "published" : "draft" }));
      setNotice(publish ? "Nashr etildi." : "Qoralama saqlandi.");
      if (!v.id) router.replace(`/dashboard/recipes/${result.id}`);
      else router.refresh();
    });

  return (
    <form
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        submit(v.status === "published");
      }}
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-amber-950">Asosiy ma’lumotlar</h2>
        <div>
          <label htmlFor="title" className={label}>Sarlavha</label>
          <input id="title" className={field} value={v.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label htmlFor="description" className={label}>Tavsif</label>
          <textarea id="description" rows={3} className={field} value={v.description} maxLength={600} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label htmlFor="cover" className={label}>Muqova rasmi havolasi</label>
          <input id="cover" type="url" inputMode="url" placeholder="https://…" className={field} value={v.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} />
          <p className="mt-1 text-xs text-amber-700">Rasm yuklash hozircha mavjud emas. O‘zingizga tegishli yoki foydalanish huquqingiz bor rasm havolasini kiriting.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label htmlFor="servings" className={label}>Porsiya</label>
            <input id="servings" type="number" min={1} className={field} value={v.servings} onChange={(e) => set("servings", e.target.value)} />
          </div>
          <div>
            <label htmlFor="prep" className={label}>Tayyorlash (daq.)</label>
            <input id="prep" type="number" min={0} className={field} value={v.prepTimeMinutes} onChange={(e) => set("prepTimeMinutes", e.target.value)} />
          </div>
          <div>
            <label htmlFor="cook" className={label}>Pishirish (daq.)</label>
            <input id="cook" type="number" min={0} className={field} value={v.cookTimeMinutes} onChange={(e) => set("cookTimeMinutes", e.target.value)} />
          </div>
          <div>
            <label htmlFor="difficulty" className={label}>Murakkablik</label>
            <select id="difficulty" className={field} value={v.difficulty} onChange={(e) => set("difficulty", e.target.value as EditorInitial["difficulty"])}>
              <option value="easy">Oson</option>
              <option value="medium">O‘rtacha</option>
              <option value="hard">Murakkab</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="tags" className={label}>Teglar (vergul bilan)</label>
          <input id="tags" className={field} value={v.tags} placeholder="O‘zbek, Guruch, Qo‘y go‘shti" onChange={(e) => set("tags", e.target.value)} />
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <label className="flex items-center gap-2 text-amber-950 min-h-11">
            <input type="checkbox" className="h-5 w-5" checked={v.isPremium} onChange={(e) => set("isPremium", e.target.checked)} />
            Premium retsept
          </label>
          {v.isPremium && (
            <div>
              <label htmlFor="price" className={label}>Narxi (so‘m)</label>
              <input id="price" type="number" min={1} className={field} value={v.priceAmount} onChange={(e) => set("priceAmount", e.target.value)} />
            </div>
          )}
        </div>
        {v.isPremium && (
          <p className="text-xs text-amber-700">To‘lov tizimi hozircha ulanmagan, shuning uchun o‘quvchilar premium retseptlarni ocha olmaydi.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-amber-950">Masalliqlar</h2>
        {v.ingredients.map((ing, i) => (
          <div key={i} className="grid grid-cols-[1fr_5rem_5rem] sm:grid-cols-[2rem_1fr_6rem_6rem_auto] gap-2 items-end">
            <span className="hidden sm:block pb-3 text-sm text-amber-700">{i + 1}</span>
            <div className="col-span-3 sm:col-span-1">
              <label className="sr-only" htmlFor={`ing-name-${i}`}>{i + 1}-masalliq nomi</label>
              <input id={`ing-name-${i}`} className={field} placeholder="Nomi" value={ing.name} onChange={(e) => setIngredient(i, { name: e.target.value })} />
            </div>
            <div className="col-span-1">
              <label className="sr-only" htmlFor={`ing-qty-${i}`}>Miqdori</label>
              <input id={`ing-qty-${i}`} className={field} placeholder="Miqdori" value={ing.quantity} onChange={(e) => setIngredient(i, { quantity: e.target.value })} />
            </div>
            <div className="col-span-1">
              <label className="sr-only" htmlFor={`ing-unit-${i}`}>Birlik</label>
              <input id={`ing-unit-${i}`} className={field} placeholder="Birlik" value={ing.unit} onChange={(e) => setIngredient(i, { unit: e.target.value })} />
            </div>
            <div className="col-span-1 flex gap-1">
              <Button type="button" size="sm" variant="ghost" aria-label="Yuqoriga" onClick={() => set("ingredients", move(v.ingredients, i, -1))}>↑</Button>
              <Button type="button" size="sm" variant="ghost" aria-label="Pastga" onClick={() => set("ingredients", move(v.ingredients, i, 1))}>↓</Button>
              <Button type="button" size="sm" variant="ghost" aria-label="Masalliqni o‘chirish" disabled={v.ingredients.length === 1} onClick={() => set("ingredients", v.ingredients.filter((_, n) => n !== i))}>✕</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set("ingredients", [...v.ingredients, { name: "", quantity: "", unit: "" }])}>
          Masalliq qo‘shish
        </Button>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif text-amber-950">Qadamlar</h2>
        {v.steps.map((s, i) => (
          <fieldset key={i} className="border-t border-amber-200 pt-4 space-y-3">
            <legend className="text-sm font-semibold text-amber-800 pr-2">Qadam {i + 1}</legend>
            <div>
              <label className={label} htmlFor={`st-title-${i}`}>Sarlavha</label>
              <input id={`st-title-${i}`} className={field} value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor={`st-ins-${i}`}>Ko‘rsatma</label>
              <textarea id={`st-ins-${i}`} rows={3} className={field} value={s.instruction} onChange={(e) => setStep(i, { instruction: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={label} htmlFor={`st-timer-${i}`}>Taymer (daq.)</label>
                <input id={`st-timer-${i}`} type="number" min={0} className={field} value={s.timerMinutes} onChange={(e) => setStep(i, { timerMinutes: e.target.value })} />
              </div>
              <div>
                <label className={label} htmlFor={`st-temp-${i}`}>Harorat (°C)</label>
                <input id={`st-temp-${i}`} type="number" min={0} className={field} value={s.temperatureCelsius} onChange={(e) => setStep(i, { temperatureCelsius: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={label} htmlFor={`st-ing-${i}`}>Ishlatiladigan masalliq raqamlari</label>
                <input id={`st-ing-${i}`} className={field} placeholder="masalan: 1, 3" value={s.ingredientPositions} onChange={(e) => setStep(i, { ingredientPositions: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor={`st-img-${i}`}>Rasm havolasi (ixtiyoriy)</label>
              <input id={`st-img-${i}`} type="url" className={field} value={s.mediaUrl} onChange={(e) => setStep(i, { mediaUrl: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor={`st-tip-${i}`}>Maslahat (ixtiyoriy)</label>
              <input id={`st-tip-${i}`} className={field} value={s.tip} onChange={(e) => setStep(i, { tip: e.target.value })} />
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => set("steps", move(v.steps, i, -1))}>Yuqoriga</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => set("steps", move(v.steps, i, 1))}>Pastga</Button>
              <Button type="button" size="sm" variant="ghost" disabled={v.steps.length === 1} onClick={() => set("steps", v.steps.filter((_, n) => n !== i))}>O‘chirish</Button>
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set("steps", [...v.steps, { title: "", instruction: "", mediaUrl: "", timerMinutes: "", temperatureCelsius: "", tip: "", ingredientPositions: "" }])}
        >
          Qadam qo‘shish
        </Button>
      </section>

      <div className="sticky bottom-0 bg-amber-50 border-t border-amber-200 py-4 space-y-2">
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" loading={pending} onClick={() => submit(false)}>
            {v.status === "published" ? "Qoralamaga qaytarish" : "Qoralamani saqlash"}
          </Button>
          <Button type="button" loading={pending} onClick={() => submit(true)}>
            {v.status === "published" ? "Saqlash" : "Nashr etish"}
          </Button>
        </div>
      </div>
    </form>
  );
}
