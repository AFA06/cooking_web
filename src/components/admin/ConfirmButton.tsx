"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  action: () => Promise<void>;
  label: string;
  /** Explains what will be lost; shown before the second click. */
  warning: string;
}

/** Two-step destructive button: the first click reveals the consequence, the second confirms. */
export function ConfirmButton({ action, label, warning }: Props) {
  const [armed, setArmed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  if (!armed) {
    return (
      <Button type="button" variant="outline" className="border-red-700/40 text-red-700 hover:bg-red-600/5" onClick={() => setArmed(true)}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <div role="alertdialog" aria-label={label} className="rounded-md border border-red-700/30 bg-red-600/5 p-4">
      <p className="text-sm text-amber-950">{warning}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="destructive" loading={pending} onClick={() => startTransition(() => action())}>
          Ha, o‘chirish
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setArmed(false)}>
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}
