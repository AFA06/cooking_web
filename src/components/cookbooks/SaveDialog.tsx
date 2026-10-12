"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Bookmark, BookOpen, Check, Plus, X } from "lucide-react";
import { createCookbook, loadSaveOptions, setRecipeKept } from "@/app/account/cookbooks/actions";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** A place a recipe can be kept: the general saved list or one of the person's cookbooks. */
interface Place {
  id: string;
  name: string;
  has: boolean;
}

/** The general list is offered first, under a fixed id the server understands. */
const SAVED_PLACE = "saved";

interface Props {
  recipeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reports whether the recipe is kept anywhere, so the button that opened the dialog can show it. */
  onKeptChange: (kept: boolean) => void;
}

/** "Save to…" dialog: tick the lists a recipe belongs to, or make a new cookbook on the spot. */
export function SaveDialog({ recipeId, open, onOpenChange, onKeptChange }: Props) {
  const router = useRouter();
  const changed = React.useRef(false);

  const change = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    // Lists elsewhere on the page (Mening oshxonam, a cookbook) should reflect what was ticked.
    if (!nextOpen && changed.current) {
      changed.current = false;
      router.refresh();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={change}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="rise fixed inset-x-0 bottom-0 z-[60] max-h-[85dvh] overflow-y-auto rounded-t-[1.75rem] border border-amber-200 bg-amber-50 p-6 shadow-soft outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[26rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem]"
        >
          <SaveSheet recipeId={recipeId} onKeptChange={onKeptChange} onChanged={() => (changed.current = true)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The dialog's contents. Mounted only while it is open, so it starts fresh and reloads every time. */
function SaveSheet({ recipeId, onKeptChange, onChanged }: Pick<Props, "recipeId" | "onKeptChange"> & { onChanged: () => void }) {
  const t = useT();
  const [places, setPlaces] = React.useState<Place[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [naming, setNaming] = React.useState(false);
  const [name, setName] = React.useState("");
  const [creating, startCreating] = React.useTransition();

  React.useEffect(() => {
    let cancelled = false;
    loadSaveOptions(recipeId).then((result) => {
      if (cancelled) return;
      if ("error" in result) return setError(result.error);
      setPlaces([{ id: SAVED_PLACE, name: t("dialog.saved"), has: result.options.saved }, ...result.options.cookbooks]);
    });
    return () => {
      cancelled = true;
    };
  }, [recipeId, t]);

  const show = (next: Place[]) => {
    setPlaces(next);
    onKeptChange(next.some((place) => place.has));
  };

  const toggle = async (place: Place) => {
    if (!places) return;
    const withPlace = (has: boolean) => places.map((p) => (p.id === place.id ? { ...p, has } : p));
    show(withPlace(!place.has)); // shown at once; put back if the server refuses
    setError(null);
    const result = await setRecipeKept(recipeId, place.id, !place.has);
    if ("error" in result) {
      show(withPlace(place.has));
      return setError(result.error);
    }
    onChanged();
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    startCreating(async () => {
      const result = await createCookbook(name, recipeId);
      if ("error" in result) return setError(result.error);
      onChanged();
      setError(null);
      setNaming(false);
      setName("");
      show([...(places ?? []), { id: result.id, name: result.name, has: true }]);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Dialog.Title className="font-serif text-2xl font-medium text-amber-950">{t("dialog.title")}</Dialog.Title>
        <Dialog.Close className="flex h-11 w-11 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-950" aria-label={t("common.close")}>
          <X className="h-5 w-5" aria-hidden="true" />
        </Dialog.Close>
      </div>

      {places === null && !error && <p className="py-8 text-center text-amber-600" role="status">{t("dialog.loading")}</p>}

      {places && (
        <ul className="mt-3">
          {places.map((place) => {
            const Icon = place.id === SAVED_PLACE ? Bookmark : BookOpen;
            return (
              <li key={place.id}>
                <label className="flex min-h-14 cursor-pointer items-center gap-3.5 rounded-xl px-2 transition-colors hover:bg-amber-100">
                  <input type="checkbox" checked={place.has} onChange={() => toggle(place)} className="peer sr-only" />
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-700 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-amber-50",
                      place.has ? "border-amber-700 bg-amber-700 text-amber-50" : "border-amber-400",
                    )}
                    aria-hidden="true"
                  >
                    {place.has && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-lg text-amber-950">{place.name}</span>
                  <Icon className="h-5 w-5 shrink-0 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}

      {places && (
        <div className="mt-3 border-t border-amber-200 pt-4">
          {naming ? (
            <form onSubmit={create} className="space-y-3">
              <label htmlFor="new-cookbook-name" className="block text-sm font-medium text-amber-950">{t("dialog.newName")}</label>
              <input
                id="new-cookbook-name"
                autoFocus
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("dialog.namePlaceholder")}
                className="h-12 w-full rounded-xl border border-amber-300 bg-amber-100 px-4 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
              />
              <div className="flex gap-2">
                <Button type="submit" loading={creating} disabled={name.trim() === ""}>{t("dialog.createSave")}</Button>
                <Button type="button" variant="ghost" onClick={() => setNaming(false)}>{t("common.cancel")}</Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setNaming(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("dialog.newCookbook")}
              </Button>
              <Dialog.Close asChild>
                <Button type="button">{t("dialog.done")}</Button>
              </Dialog.Close>
            </div>
          )}
        </div>
      )}
    </>
  );
}
