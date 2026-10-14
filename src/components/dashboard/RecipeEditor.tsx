"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Clock, Film, Lock, LockOpen, Plus } from "lucide-react";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { VideoUploader } from "@/components/dashboard/VideoUploader";
import { Button } from "@/components/ui/Button";
import { useLocale, useT } from "@/i18n/client";
import { UNIT_SUGGESTIONS } from "@/lib/kitchen-words";
import { RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/categories";
import { estimateNutrition } from "@/lib/nutrition";
import type { RecipeInput } from "@/lib/recipe-schema";
import { maxMegabytes } from "@/lib/media";
import { discardMedia } from "@/lib/media-upload";
import { parseVideoUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

type Ingredient = { name: string; quantity: string; unit: string };
type Step = {
  /** The step's id in the database once it has been saved; its photo and clip are tied to it. */
  id: string | null;
  /** Identifies the step on this page from the moment it is added, through reordering and saving. */
  key: string;
  title: string;
  instruction: string;
  /** Premium recipes only: readers can see this step before buying. */
  isFree: boolean;
  mediaUrl: string;
  videoUrl: string;
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
  galleryUrls: string[];
  videoUrl: string;
  secretNotes: string;
  servings: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  difficulty: "easy" | "medium" | "hard";
  category: RecipeCategory;
  calories: string;
  proteinGrams: string;
  fatGrams: string;
  carbGrams: string;
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
  galleryUrls: [],
  videoUrl: "",
  secretNotes: "",
  servings: "4",
  prepTimeMinutes: "15",
  cookTimeMinutes: "30",
  difficulty: "easy",
  category: "main",
  calories: "",
  proteinGrams: "",
  fatGrams: "",
  carbGrams: "",
  isPremium: false,
  priceAmount: "",
  tags: "",
  status: "draft",
  ingredients: [{ name: "", quantity: "", unit: "" }],
  steps: [{ id: null, key: "first", title: "", instruction: "", isFree: false, mediaUrl: "", videoUrl: "", timerMinutes: "", temperatureCelsius: "", tip: "", ingredientPositions: "" }],
};

const field =
  "w-full min-h-12 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2.5 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";
const label = "block text-sm font-medium text-amber-950";

const NUTRITION_FIELDS = [
  { key: "calories", text: "ed.calories" },
  { key: "proteinGrams", text: "ed.protein" },
  { key: "fatGrams", text: "ed.fat" },
  { key: "carbGrams", text: "ed.carbs" },
] as const;

function toInput(v: EditorInitial): RecipeInput {
  return {
    title: v.title,
    description: v.description,
    coverUrl: v.coverUrl,
    galleryUrls: v.galleryUrls.map((url) => url.trim()).filter(Boolean),
    videoUrl: v.videoUrl.trim(),
    secretNotes: v.secretNotes,
    servings: Number(v.servings),
    prepTimeMinutes: Number(v.prepTimeMinutes),
    cookTimeMinutes: Number(v.cookTimeMinutes),
    difficulty: v.difficulty,
    category: v.category,
    calories: v.calories === "" ? null : Number(v.calories),
    proteinGrams: v.proteinGrams === "" ? null : Number(v.proteinGrams),
    fatGrams: v.fatGrams === "" ? null : Number(v.fatGrams),
    carbGrams: v.carbGrams === "" ? null : Number(v.carbGrams),
    isPremium: v.isPremium,
    priceAmount: v.isPremium && v.priceAmount ? Number(v.priceAmount) : null,
    tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
    ingredients: v.ingredients,
    steps: v.steps.map((s) => ({
      id: s.id ?? undefined,
      title: s.title,
      instruction: s.instruction,
      isFree: s.isFree,
      mediaUrl: s.mediaUrl,
      videoUrl: s.videoUrl,
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

type SaveAction = (recipeId: string | null, input: RecipeInput, publish: boolean) => Promise<{ error: string } | { id: string; stepIds: string[] }>;

interface RecipeEditorProps {
  initial: EditorInitial;
  /** Server action that persists the recipe. */
  save: SaveAction;
  /** Where the edit page for a recipe lives, e.g. "/dashboard/recipes". */
  basePath: string;
  /** The side column with the live card and checklist; the admin panel is too narrow for it. */
  sidebar?: boolean;
}

const MAX_GALLERY = 5;
const blankStep = (): Step => ({ id: null, key: crypto.randomUUID(), title: "", instruction: "", isFree: false, mediaUrl: "", videoUrl: "", timerMinutes: "", temperatureCelsius: "", tip: "", ingredientPositions: "" });

const parsePositions = (value: string) =>
  value
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

/** One titled card of the form, with a step number so the page reads top to bottom. */
function Section({ n, title, note, children }: { n: number; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-100/40 p-5 sm:p-7">
      <header className="mb-6 flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-700 font-serif text-lg font-semibold text-amber-50" aria-hidden="true">
          {n}
        </span>
        <div>
          <h2 className="font-serif text-2xl font-medium text-amber-950">{title}</h2>
          {note && <p className="mt-0.5 text-sm text-amber-600">{note}</p>}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function RecipeEditor({ initial, save, basePath, sidebar = true }: RecipeEditorProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [v, setV] = React.useState<EditorInitial>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const set = <K extends keyof EditorInitial>(key: K, value: EditorInitial[K]) => setV((p) => ({ ...p, [key]: value }));
  const setIngredient = (i: number, patch: Partial<Ingredient>) =>
    set("ingredients", v.ingredients.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  // A clip can take a while to upload; this must not put back the steps as they were when it started.
  const setStep = (i: number, patch: Partial<Step>) => setV((p) => ({ ...p, steps: p.steps.map((x, n) => (n === i ? { ...x, ...patch } : x)) }));
  // Photos and clips still on their way up; the recipe is not saved until they have landed.
  const [uploads, setUploads] = React.useState(0);
  const trackUpload = React.useCallback((busy: boolean) => setUploads((n) => Math.max(0, n + (busy ? 1 : -1))), []);
  const removeStep = (i: number) => {
    // Files the step uploaded but no saved recipe uses are dropped; saved ones go when the recipe is saved without them.
    for (const url of [v.steps[i].mediaUrl, v.steps[i].videoUrl]) if (url) discardMedia(url);
    set("steps", v.steps.filter((_, n) => n !== i));
  };
  const [nutritionNote, setNutritionNote] = React.useState<string | null>(null);
  const calculateNutrition = () => {
    const { perServing, skipped } = estimateNutrition(v.ingredients, Number(v.servings));
    if (!perServing) return setNutritionNote(t("ed.calcFail"));
    setV((p) => ({
      ...p,
      calories: String(perServing.calories),
      proteinGrams: String(perServing.proteinGrams),
      fatGrams: String(perServing.fatGrams),
      carbGrams: String(perServing.carbGrams),
    }));
    setNutritionNote(t("ed.calcDone", { servings: v.servings }) + (skipped.length > 0 ? t("ed.calcSkipped", { list: skipped.join(", ") }) : t("ed.calcCheck")));
  };
  const move = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = list.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  // Moving or deleting an ingredient renumbers the others, so the steps' picks follow the right ones.
  const reorderIngredients = (next: Ingredient[], mapping: (oldNumber: number) => number | null) => {
    setV((p) => ({
      ...p,
      ingredients: next,
      steps: p.steps.map((s) => ({
        ...s,
        ingredientPositions: parsePositions(s.ingredientPositions)
          .map(mapping)
          .filter((n): n is number => n !== null)
          .sort((a, b) => a - b)
          .join(", "),
      })),
    }));
  };

  const togglePosition = (stepIndex: number, position: number) => {
    const current = parsePositions(v.steps[stepIndex].ingredientPositions);
    const next = current.includes(position) ? current.filter((n) => n !== position) : [...current, position].sort((a, b) => a - b);
    setStep(stepIndex, { ingredientPositions: next.join(", ") });
  };

  const video = v.videoUrl.trim() ? parseVideoUrl(v.videoUrl) : undefined;

  /* readiness: what a reader needs before the recipe is worth publishing */
  const checks = [
    { key: "title", label: t("ed.check.title"), done: v.title.trim().length >= 3 && v.description.trim().length >= 10, required: true },
    { key: "cover", label: t("ed.coverPhoto"), done: v.coverUrl.trim() !== "", required: true },
    { key: "ingredients", label: t("ed.ingredients"), done: v.ingredients.some((i) => i.name.trim() && i.quantity.trim()), required: true },
    { key: "steps", label: t("ed.steps"), done: v.steps.some((s) => s.title.trim() && s.instruction.trim()), required: true },
    { key: "video", label: t("ed.video"), done: !!video, required: false },
    { key: "nutrition", label: t("ed.check.nutrition"), done: v.calories !== "", required: false },
    ...(v.isPremium ? [{ key: "freeStep", label: t("ed.check.freeStep"), done: v.steps.some((s) => s.isFree), required: false }] : []),
    ...(v.isPremium ? [{ key: "secrets", label: t("ed.check.secrets"), done: v.secretNotes.trim() !== "", required: false }] : []),
  ];
  const ready = checks.filter((c) => c.required).every((c) => c.done);
  const total = v.prepTimeMinutes && v.cookTimeMinutes ? Number(v.prepTimeMinutes) + Number(v.cookTimeMinutes) : 0;

  const submit = (publish: boolean) => {
    if (uploads > 0) return;
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const sent = v.steps.map((s) => s.key);
      const result = await save(v.id, toInput(v), publish);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Each step learns its saved id, so the next save updates it instead of making a new one.
      const savedId = new Map(sent.map((key, n) => [key, result.stepIds[n]]));
      setV((p) => ({ ...p, id: result.id, status: publish ? "published" : "draft", steps: p.steps.map((s) => ({ ...s, id: savedId.get(s.key) ?? s.id })) }));
      setNotice(publish ? t("ed.published") : t("ed.draftSaved"));
      if (!v.id) router.replace(`${basePath}/${result.id}`);
      else router.refresh();
    });
  };

  return (
    <form
      className={cn("grid items-start gap-8", sidebar && "xl:grid-cols-[minmax(0,1fr)_21rem]")}
      onSubmit={(e) => {
        e.preventDefault();
        submit(v.status === "published");
      }}
    >
      <div className="min-w-0 space-y-6">
        {/* 1 — basics */}
        <Section n={1} title={t("profile.basics")}>
          <div>
            <label htmlFor="title" className={label}>{t("ed.title")}</label>
            <input id="title" className={cn(field, "mt-1.5 text-lg")} value={v.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label htmlFor="description" className={label}>{t("ed.description")}</label>
            <textarea id="description" rows={3} className={cn(field, "mt-1.5")} value={v.description} maxLength={600} onChange={(e) => set("description", e.target.value)} />
            <p className="mt-1 text-xs text-amber-600 tabular-nums">{v.description.length} / 600</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="servings" className={label}>{t("ed.servings")}</label>
              <input id="servings" type="number" min={1} className={cn(field, "mt-1.5")} value={v.servings} onChange={(e) => set("servings", e.target.value)} />
            </div>
            <div>
              <label htmlFor="prep" className={label}>{t("ed.prepMin")}</label>
              <input id="prep" type="number" min={0} className={cn(field, "mt-1.5")} value={v.prepTimeMinutes} onChange={(e) => set("prepTimeMinutes", e.target.value)} />
            </div>
            <div>
              <label htmlFor="cook" className={label}>{t("ed.cookMin")}</label>
              <input id="cook" type="number" min={0} className={cn(field, "mt-1.5")} value={v.cookTimeMinutes} onChange={(e) => set("cookTimeMinutes", e.target.value)} />
            </div>
            <div>
              <label htmlFor="difficulty" className={label}>{t("recipes.filterDifficulty")}</label>
              <select id="difficulty" className={cn(field, "mt-1.5")} value={v.difficulty} onChange={(e) => set("difficulty", e.target.value as EditorInitial["difficulty"])}>
                <option value="easy">{t("difficulty.easy")}</option>
                <option value="medium">{t("difficulty.medium")}</option>
                <option value="hard">{t("difficulty.hard")}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <label htmlFor="category" className={label}>{t("ed.category")}</label>
              <select id="category" className={cn(field, "mt-1.5")} value={v.category} onChange={(e) => set("category", e.target.value as RecipeCategory)}>
                {RECIPE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{t(c.label)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tags" className={label}>{t("ed.tags")}</label>
              <input id="tags" className={cn(field, "mt-1.5")} value={v.tags} placeholder={t("ed.tagsPlaceholder")} onChange={(e) => set("tags", e.target.value)} />
            </div>
          </div>
        </Section>

        {/* 2 — photos and video */}
        <Section n={2} title={t("ed.sec.media")} note={t("ed.coverHint")}>
          <div>
            <p className={label}>{t("ed.coverPhoto")}</p>
            <div className="mt-2 max-w-xl">
              <ImageUploader value={v.coverUrl} onChange={(url) => set("coverUrl", url)} label={t("ed.coverPhoto")} />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className={label}>{t("ed.gallery")}</p>
              <p className="text-xs text-amber-600">{t("up.max", { max: MAX_GALLERY })}</p>
            </div>
            <p className="mt-0.5 text-sm text-amber-600">{t("ed.galleryHint2")}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {v.galleryUrls.map((url, i) => (
                <ImageUploader
                  key={`${i}-${url}`}
                  value={url}
                  compact
                  shape="square"
                  onChange={(next) => set("galleryUrls", next ? v.galleryUrls.map((u, n) => (n === i ? next : u)) : v.galleryUrls.filter((_, n) => n !== i))}
                />
              ))}
              {v.galleryUrls.length < MAX_GALLERY && (
                <ImageUploader key={`new-${v.galleryUrls.length}`} value="" compact shape="square" label={t("up.add")} onChange={(url) => url && set("galleryUrls", [...v.galleryUrls, url])} />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="video" className={cn(label, "flex items-center gap-2")}>
              <Film className="h-4 w-4 text-amber-700" aria-hidden="true" />
              {t("ed.video")}
            </label>
            <input
              id="video"
              type="url"
              inputMode="url"
              placeholder="https://youtu.be/…"
              className={cn(field, "mt-1.5")}
              value={v.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
            />
            <p className="mt-1.5 text-sm text-amber-600">{t("ed.videoHint")}</p>
            {v.videoUrl.trim() !== "" && (
              <p role="status" className={cn("mt-1.5 text-sm font-medium", video ? "text-sage-700" : "text-red-700")}>
                {video ? t("ed.videoOk") : t("ed.videoBad")}
              </p>
            )}
            {video && video.kind !== "file" && (
              <div className="mt-3 aspect-video max-w-xl overflow-hidden rounded-2xl bg-ink">
                <iframe src={video.embedUrl} title={t("detail.video")} loading="lazy" allowFullScreen className="h-full w-full" />
              </div>
            )}
            {video && video.kind === "file" && <video src={video.src} controls preload="metadata" playsInline className="mt-3 aspect-video max-w-xl rounded-2xl bg-ink" />}
          </div>
        </Section>

        {/* 3 — ingredients and nutrition */}
        <Section n={3} title={t("ed.ingredients")}>
          <p className="text-sm leading-relaxed text-amber-600">{t("ed.ingUnitsHint")}</p>
          <datalist id="ing-units">
            {UNIT_SUGGESTIONS[locale].map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
          <div className="space-y-3">
            {v.ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem_5rem] items-end gap-2 sm:grid-cols-[2rem_1fr_6rem_6rem_auto]">
                <span className="hidden pb-3 text-center font-serif text-lg text-amber-600 sm:block">{i + 1}</span>
                <div className="col-span-3 sm:col-span-1">
                  <label className="sr-only" htmlFor={`ing-name-${i}`}>{t("ed.ingName", { n: i + 1 })}</label>
                  <input id={`ing-name-${i}`} className={field} placeholder={t("ed.namePh")} value={ing.name} onChange={(e) => setIngredient(i, { name: e.target.value })} />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`ing-qty-${i}`}>{t("ed.qtyPh")}</label>
                  <input id={`ing-qty-${i}`} className={field} placeholder={t("ed.qtyPh")} value={ing.quantity} onChange={(e) => setIngredient(i, { quantity: e.target.value })} />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`ing-unit-${i}`}>{t("ed.unitPh")}</label>
                  <input id={`ing-unit-${i}`} list="ing-units" className={field} placeholder={t("ed.unitPh")} value={ing.unit} onChange={(e) => setIngredient(i, { unit: e.target.value })} />
                </div>
                <div className="col-span-3 flex gap-1 sm:col-span-1">
                  <Button type="button" size="sm" variant="ghost" aria-label={t("ed.up")} disabled={i === 0} onClick={() => reorderIngredients(move(v.ingredients, i, -1), (n) => (n === i + 1 ? i : n === i ? i + 1 : n))}>↑</Button>
                  <Button type="button" size="sm" variant="ghost" aria-label={t("ed.down")} disabled={i === v.ingredients.length - 1} onClick={() => reorderIngredients(move(v.ingredients, i, 1), (n) => (n === i + 1 ? i + 2 : n === i + 2 ? i + 1 : n))}>↓</Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t("ed.deleteIng")}
                    disabled={v.ingredients.length === 1}
                    onClick={() => reorderIngredients(v.ingredients.filter((_, n) => n !== i), (n) => (n === i + 1 ? null : n > i + 1 ? n - 1 : n))}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => set("ingredients", [...v.ingredients, { name: "", quantity: "", unit: "" }])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("ed.addIng")}
          </Button>

          <fieldset className="border-t border-amber-200 pt-5">
            <legend className={cn(label, "pr-2")}>{t("ed.nutrition")}</legend>
            <p className="text-xs text-amber-600">{t("ed.nutritionNote")}</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {NUTRITION_FIELDS.map(({ key, text }) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-xs text-amber-600">{t(text)}</label>
                  <input id={key} type="number" min={0} className={field} value={v[key]} onChange={(e) => set(key, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button type="button" variant="outline" size="sm" onClick={calculateNutrition}>{t("ed.calcFrom")}</Button>
              {nutritionNote && <p className="text-xs text-amber-900" role="status">{nutritionNote}</p>}
            </div>
          </fieldset>
        </Section>

        {/* 4 — steps */}
        <Section n={4} title={t("ed.steps")} note={v.isPremium ? t("ed.stepsAccessNote", { free: v.steps.filter((s) => s.isFree).length, total: v.steps.length }) : undefined}>
          <div className="space-y-5">
            {v.steps.map((s, i) => {
              const picked = parsePositions(s.ingredientPositions);
              return (
                <fieldset key={s.key} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                  <legend className="flex items-center gap-2 px-2 font-serif text-lg font-semibold text-amber-950">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-400 text-sm text-amber-50">{i + 1}</span>
                    {t("ed.stepN", { n: i + 1 })}
                  </legend>
                  {v.isPremium && (
                    <div role="radiogroup" aria-label={t("ed.stepAccess")} className="mt-2 grid max-w-md grid-cols-2 gap-2">
                      {([
                        { free: true, text: t("ed.stepFree"), Icon: LockOpen },
                        { free: false, text: t("ed.stepPremium"), Icon: Lock },
                      ] as const).map(({ free, text, Icon }) => {
                        const selected = s.isFree === free;
                        return (
                          <button
                            key={String(free)}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setStep(i, { isFree: free })}
                            className={cn(
                              "flex h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-base font-semibold transition-colors",
                              selected
                                ? free
                                  ? "border-sage-600 bg-sage-100 text-sage-900"
                                  : "border-amber-700 bg-amber-100 text-amber-950"
                                : "border-amber-200 text-amber-700 hover:border-amber-400",
                            )}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            {text}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={label} htmlFor={`st-title-${i}`}>{t("ed.title")}</label>
                      <input id={`st-title-${i}`} className={cn(field, "mt-1.5")} value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
                    </div>
                    <div>
                      <label className={label} htmlFor={`st-ins-${i}`}>{t("ed.instruction")}</label>
                      <textarea id={`st-ins-${i}`} rows={3} className={cn(field, "mt-1.5")} value={s.instruction} onChange={(e) => setStep(i, { instruction: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
                    <div>
                      <p className={label}>{t("ed.stepPhoto")}</p>
                      <div className="mt-1.5">
                        <ImageUploader value={s.mediaUrl} compact stored onBusy={trackUpload} onChange={(url) => setStep(i, { mediaUrl: url })} label={t("ed.stepPhoto")} />
                      </div>
                    </div>
                    <div>
                      <p className={cn(label, "flex items-center gap-1.5")}>
                        <Film className="h-4 w-4 text-amber-700" aria-hidden="true" />
                        {t("ed.stepVideo")}
                      </p>
                      <div className="mt-1.5">
                        <VideoUploader value={s.videoUrl} onBusy={trackUpload} onChange={(url) => setStep(i, { videoUrl: url })} label={t("ed.stepVideo")} />
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 sm:col-span-2">{t("ed.stepVideoHint", { mb: maxMegabytes("video") })}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
                    <div>
                      <label className={cn(label, "flex items-center gap-1.5")} htmlFor={`st-timer-${i}`}>
                        <Clock className="h-4 w-4 text-amber-700" aria-hidden="true" />
                        {t("ed.timerMin")}
                      </label>
                      <input id={`st-timer-${i}`} type="number" min={0} className={cn(field, "mt-1.5")} value={s.timerMinutes} onChange={(e) => setStep(i, { timerMinutes: e.target.value })} />
                    </div>
                    <div>
                      <label className={label} htmlFor={`st-temp-${i}`}>{t("ed.temp")}</label>
                      <input id={`st-temp-${i}`} type="number" min={0} className={cn(field, "mt-1.5")} value={s.temperatureCelsius} onChange={(e) => setStep(i, { temperatureCelsius: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className={label}>{t("ed.stepIngsPick")}</p>
                    {v.ingredients.some((ing) => ing.name.trim()) ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {v.ingredients.map((ing, n) =>
                          ing.name.trim() ? (
                            <button
                              key={n}
                              type="button"
                              aria-pressed={picked.includes(n + 1)}
                              onClick={() => togglePosition(i, n + 1)}
                              className={cn(
                                "flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
                                picked.includes(n + 1) ? "border-sage-600 bg-sage-100 font-semibold text-sage-900" : "border-amber-300 text-amber-900 hover:border-amber-950",
                              )}
                            >
                              {picked.includes(n + 1) && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                              {ing.name}
                            </button>
                          ) : null,
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-amber-600">{t("ed.stepIngsNone")}</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className={label} htmlFor={`st-tip-${i}`}>{t("ed.tipOptional")}</label>
                    <input id={`st-tip-${i}`} className={cn(field, "mt-1.5")} value={s.tip} onChange={(e) => setStep(i, { tip: e.target.value })} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1 border-t border-amber-200 pt-3">
                    <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => set("steps", move(v.steps, i, -1))}>{t("ed.moveStepUp")}</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={i === v.steps.length - 1} onClick={() => set("steps", move(v.steps, i, 1))}>{t("ed.moveStepDown")}</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={v.steps.length === 1} onClick={() => removeStep(i)}>{t("common.delete")}</Button>
                  </div>
                </fieldset>
              );
            })}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => set("steps", [...v.steps, blankStep()])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("ed.addStep")}
          </Button>
        </Section>

        {/* 5 — price and secrets */}
        <Section n={5} title={t("ed.sec.pricing")}>
          <div role="radiogroup" aria-label={t("ed.type")} className="grid gap-3 sm:grid-cols-2">
            {([
              { premium: false, title: t("filter.free"), note: t("ed.typeFreeNote") },
              { premium: true, title: t("filter.premium"), note: t("ed.typePremiumNote") },
            ] as const).map((option) => {
              const selected = v.isPremium === option.premium;
              return (
                <button
                  key={String(option.premium)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("isPremium", option.premium)}
                  className={cn(
                    "rounded-2xl border-2 p-5 text-left transition-colors",
                    selected ? "border-amber-700 bg-amber-100" : "border-amber-200 hover:border-amber-400",
                  )}
                >
                  <span className="flex items-center gap-2 font-serif text-xl font-semibold text-amber-950">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", selected ? "border-amber-700 bg-amber-700" : "border-amber-400")} aria-hidden="true">
                      {selected && <Check className="h-3 w-3 text-amber-50" strokeWidth={4} />}
                    </span>
                    {option.title}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-amber-600">{option.note}</span>
                </button>
              );
            })}
          </div>

          {v.isPremium && (
            <>
              <div className="max-w-xs">
                <label htmlFor="price" className={label}>{t("ed.price")}</label>
                <input id="price" type="number" min={1} className={cn(field, "mt-1.5")} value={v.priceAmount} onChange={(e) => set("priceAmount", e.target.value)} />
                <p className="mt-2 text-xs text-amber-600">{t("ed.premiumNote")}</p>
              </div>
              <div>
                <label htmlFor="secrets" className={cn(label, "flex items-center gap-2")}>
                  <Lock className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  {t("ed.secrets")}
                </label>
                <p className="mt-1 text-sm text-amber-600">{t("ed.secretsHint")}</p>
                <textarea
                  id="secrets"
                  rows={6}
                  maxLength={4000}
                  className={cn(field, "mt-2")}
                  value={v.secretNotes}
                  placeholder={t("ed.secretsPh")}
                  onChange={(e) => set("secretNotes", e.target.value)}
                />
                <p className="mt-1 text-xs tabular-nums text-amber-600">{v.secretNotes.length} / 4000</p>
              </div>
            </>
          )}
        </Section>

        <div className="sticky bottom-0 z-10 space-y-2 rounded-t-2xl border-t border-amber-200 bg-amber-50/95 px-1 py-4 backdrop-blur">
          {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
          {notice && <p role="status" className="text-sm font-medium text-sage-700">{notice}</p>}
          {uploads > 0 && <p role="status" className="text-sm font-medium text-amber-700">{t("ed.waitUploads")}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" size="lg" loading={pending} disabled={uploads > 0} onClick={() => submit(false)}>
              {v.status === "published" ? t("ed.toDraft") : t("ed.saveDraft")}
            </Button>
            <Button type="button" size="lg" loading={pending} disabled={uploads > 0} onClick={() => submit(true)}>
              {v.status === "published" ? t("common.save") : t("ed.publish")}
            </Button>
          </div>
        </div>
      </div>

      {/* side: what readers will see, and what is still missing */}
      {sidebar && (
        <aside className="space-y-5 xl:sticky xl:top-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">{t("ed.preview")}</p>
            <article className="overflow-hidden rounded-[1.25rem] border border-amber-200 bg-amber-100">
              <div className="relative aspect-[4/3] bg-amber-200">
                {v.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- live preview of the creator's own photo
                  <img src={v.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-amber-500">{t("studio.noCover")}</span>
                )}
                <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", v.isPremium ? "bg-amber-950/90 text-amber-50" : "bg-sage-600/95 text-amber-50")}>
                  {v.isPremium ? t("filter.premium") : t("filter.free")}
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-xl font-medium leading-tight text-amber-950">{v.title.trim() || t("ed.untitled")}</h3>
                {total > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-600">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {t("time.min", { count: total })}
                  </p>
                )}
              </div>
            </article>
          </div>

          <div className="rounded-2xl border border-amber-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">{t("ed.checkTitle")}</p>
            <ul className="mt-3 space-y-2">
              {checks.map((c) => (
                <li key={c.key} className="flex items-center gap-2.5 text-[0.95rem]">
                  {c.done ? <Check className="h-5 w-5 shrink-0 text-sage-600" strokeWidth={3} aria-hidden="true" /> : <Circle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />}
                  <span className={c.done ? "text-amber-950" : "text-amber-600"}>
                    {c.label}
                    {!c.required && <span className="ml-1.5 text-xs text-amber-500">· {t("ed.optional")}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {ready && <p className="mt-4 rounded-xl bg-sage-100 px-3 py-2 text-sm font-semibold text-sage-900">{t("ed.ready")}</p>}
          </div>
        </aside>
      )}
    </form>
  );
}
