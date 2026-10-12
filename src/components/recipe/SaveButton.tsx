"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { SaveDialog } from "@/components/cookbooks/SaveDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  recipeId: string;
  slug: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}

/** The recipe page's save button; opens the "save to…" sheet. */
export function SaveButton({ recipeId, slug, initialSaved, isLoggedIn }: Props) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [open, setOpen] = React.useState(false);

  if (!isLoggedIn) {
    return (
      <Button size="lg" variant="outline" asChild>
        <Link href={`/auth/login?next=${encodeURIComponent(`/recipes/${slug}`)}`}>Saqlash uchun kiring</Link>
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" variant="outline" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Bookmark className={cn("h-4 w-4", saved && "fill-amber-700 text-amber-700")} aria-hidden="true" />
        {saved ? "Saqlangan" : "Retseptni saqlash"}
      </Button>
      <SaveDialog recipeId={recipeId} open={open} onOpenChange={setOpen} onKeptChange={setSaved} />
    </>
  );
}
