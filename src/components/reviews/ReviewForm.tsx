"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitReview } from "@/app/recipes/actions";
import { cn } from "@/lib/utils";

const LABELS = ["", "Yoqmadi", "O‘rtacha", "Yaxshi", "Juda yaxshi", "A’lo"];
const MAX_SIDE = 1280;
/** Stay under the server's limit with room to spare. */
const MAX_BASE64_LENGTH = 700_000;

/** Shrinks a photo in the browser so uploads stay small on mobile data. Returns base64 JPEG data. */
async function resizePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const data = canvas.toDataURL("image/jpeg", quality).split(",")[1];
    if (data.length <= MAX_BASE64_LENGTH) return data;
  }
  throw new Error("too large");
}

interface Props {
  recipeId: string;
  initial?: { rating: number; comment: string; photoId: string | null } | null;
  /** Called after a successful save, e.g. to move on from the finish screen. */
  onDone?: () => void;
}

export function ReviewForm({ recipeId, initial, onDone }: Props) {
  const router = useRouter();
  const [rating, setRating] = React.useState(initial?.rating ?? 0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState(initial?.comment ?? "");
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const shown = hover || rating;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      setPhoto(await resizePhoto(file));
    } catch {
      setError("Bu rasmni yuklab bo‘lmadi. Boshqa rasm tanlab ko‘ring.");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Avval yulduzcha bilan baho bering.");
    startTransition(async () => {
      setError(null);
      const result = await submitReview({ recipeId, rating, comment, photo: photo ? { mime: "image/jpeg", data: photo } : null });
      if ("error" in result) return setError(result.error);
      setSaved(true);
      router.refresh();
      onDone?.();
    });
  };

  if (saved && !onDone) {
    return (
      <p role="status" className="rounded-2xl bg-sage-50 px-5 py-4 font-medium text-sage-900">
        Rahmat! Bahoyingiz saqlandi.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-medium text-amber-950">Bahoyingiz</legend>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="cursor-pointer p-1" onMouseEnter={() => setHover(value)}>
                <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="peer sr-only" />
                <Star
                  className={cn("h-9 w-9 transition-transform peer-focus-visible:scale-110 peer-focus-visible:text-amber-700", value <= shown ? "fill-clay-400 text-clay-400" : "text-amber-300")}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="sr-only">{value} yulduz — {LABELS[value]}</span>
              </label>
            ))}
          </div>
          <span className="text-sm font-medium text-amber-900" aria-hidden="true">{LABELS[shown]}</span>
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-comment" className="text-sm font-medium text-amber-950">Fikringiz (ixtiyoriy)</label>
        <textarea
          id="review-comment"
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Taom qanday chiqdi? Nimani o‘zgartirdingiz?"
          className="mt-1.5 w-full rounded-2xl border border-amber-300 bg-white px-4 py-3 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
        />
      </div>

      <div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pickPhoto(e.target.files?.[0])} aria-label="Natija rasmini tanlash" />
        {photo ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a just-selected file */}
            <img src={`data:image/jpeg;base64,${photo}`} alt="Tanlangan rasm" className="h-28 w-36 rounded-2xl object-cover" />
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-950 text-amber-50"
              aria-label="Rasmni olib tashlash"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            <Camera className="h-4 w-4" aria-hidden="true" />
            {initial?.photoId ? "Rasmni almashtirish" : "Natija rasmini qo‘shish"}
          </Button>
        )}
      </div>

      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <Button type="submit" size="lg" loading={pending}>{initial ? "Bahoni yangilash" : "Bahoni yuborish"}</Button>
    </form>
  );
}
