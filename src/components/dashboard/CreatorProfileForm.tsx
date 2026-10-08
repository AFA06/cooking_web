"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { becomeCreator, type ActionResult } from "@/app/dashboard/actions";

const field = "mt-1 w-full min-h-11 px-3 py-2 border border-amber-300 bg-white text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-600";

export function CreatorProfileForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = React.useActionState<ActionResult, FormData>(becomeCreator, {});
  return (
    <form action={action} className="mt-8 space-y-5 max-w-md">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-amber-950">Display name</label>
        <input id="name" name="name" required defaultValue={defaultName} maxLength={80} className={field} />
      </div>
      <div>
        <label htmlFor="bio" className="text-sm font-medium text-amber-950">Short bio (optional)</label>
        <textarea id="bio" name="bio" rows={3} maxLength={500} className={field} />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" loading={pending}>Create creator profile</Button>
    </form>
  );
}
