"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { SaveDialog } from "@/components/cookbooks/SaveDialog";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

interface Props {
  recipeId: string;
  slug: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  className?: string;
}

const shell =
  "flex h-11 w-11 items-center justify-center rounded-full bg-amber-50/95 text-amber-950 shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95";

/** Round save control that sits on top of recipe photography; opens the "save to…" sheet. */
export function BookmarkButton({ recipeId, slug, initialSaved, isLoggedIn, className }: Props) {
  const t = useT();
  const [saved, setSaved] = React.useState(initialSaved);
  const [open, setOpen] = React.useState(false);

  if (!isLoggedIn) {
    return (
      <Link href={`/auth/login?next=${encodeURIComponent(`/recipes/${slug}`)}`} aria-label={t("save.loginToSave")} className={cn(shell, className)}>
        <Bookmark className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={saved ? t("save.savedChange") : t("save.save")} className={cn(shell, className)}>
        <Bookmark className={cn("h-5 w-5 transition-colors", saved && "fill-amber-700 text-amber-700")} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <SaveDialog recipeId={recipeId} open={open} onOpenChange={setOpen} onKeptChange={setSaved} />
    </>
  );
}
