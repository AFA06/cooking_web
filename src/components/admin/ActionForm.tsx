"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/app/admin/actions";

interface Props {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
}

/** Form wrapper that shows the server action's result and a pending state. */
export function ActionForm({ action, submitLabel, children }: Props) {
  const [state, formAction, pending] = React.useActionState(action, {});
  return (
    <form action={formAction} className="space-y-5">
      {children}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button type="submit" loading={pending}>{submitLabel}</Button>
        {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
        {state.ok && !pending && <p role="status" className="text-sm font-medium text-emerald-700">{state.ok}</p>}
      </div>
    </form>
  );
}
