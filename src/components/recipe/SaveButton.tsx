"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toggleSaveRecipe } from "@/app/recipes/actions";

interface Props {
  recipeId: string;
  slug: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}

export function SaveButton({ recipeId, slug, initialSaved, isLoggedIn }: Props) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (!isLoggedIn) {
    return (
      <Button size="lg" variant="outline" asChild>
        <Link href={`/auth/login?next=${encodeURIComponent(`/recipes/${slug}`)}`}>Log in to save</Link>
      </Button>
    );
  }

  return (
    <div>
      <Button
        size="lg"
        variant="outline"
        loading={pending}
        aria-pressed={saved}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await toggleSaveRecipe(recipeId, slug);
            if ("error" in result) setError(result.error);
            else setSaved(result.saved);
          })
        }
      >
        {saved ? "Saved ✓" : "Save recipe"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
