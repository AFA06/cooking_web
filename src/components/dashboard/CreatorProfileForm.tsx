"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { becomeCreator, type ActionResult } from "@/app/dashboard/actions";

const field = "mt-1.5 w-full min-h-12 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2.5 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";

export function CreatorProfileForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = React.useActionState<ActionResult, FormData>(becomeCreator, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-amber-950">Ko‘rinadigan ism</label>
        <input id="name" name="name" required defaultValue={defaultName} maxLength={80} className={field} />
      </div>
      <div>
        <label htmlFor="bio" className="text-sm font-medium text-amber-950">Qisqacha tanishtiruv (ixtiyoriy)</label>
        <textarea id="bio" name="bio" rows={3} maxLength={500} className={field} />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" loading={pending}>Ijodkor profilini yaratish</Button>
    </form>
  );
}
