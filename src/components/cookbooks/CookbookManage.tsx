"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createCookbook, deleteCookbook, renameCookbook } from "@/app/account/cookbooks/actions";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

const field = "h-12 w-full max-w-sm rounded-xl border border-amber-300 bg-amber-100 px-4 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";

/** A name field with save and cancel, shared by "new cookbook" and "rename". */
function NameForm({ initial, submitLabel, onSubmit, onCancel }: { initial: string; submitLabel: string; onSubmit: (name: string) => Promise<{ error: string } | object>; onCancel: () => void }) {
  const t = useT();
  const [name, setName] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await onSubmit(name);
      if ("error" in result) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center gap-2">
        <input autoFocus maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("dialog.namePlaceholder")} aria-label={t("cookbook.nameLabel")} className={field} />
        <Button type="submit" loading={pending} disabled={name.trim() === ""}>{submitLabel}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </form>
  );
}

/** "New cookbook" on Mening oshxonam: a button that turns into a name field. */
export function NewCookbook() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("dialog.newCookbook")}
      </Button>
    );
  }
  return (
    <NameForm
      initial=""
      submitLabel={t("cookbook.create")}
      onCancel={() => setOpen(false)}
      onSubmit={async (name) => {
        const result = await createCookbook(name, null);
        if ("ok" in result) {
          setOpen(false);
          router.refresh();
        }
        return result;
      }}
    />
  );
}

/** Rename and delete for one cookbook, shown on its own page. */
export function CookbookControls({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const [mode, setMode] = React.useState<"idle" | "renaming" | "deleting">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (mode === "renaming") {
    return (
      <NameForm
        initial={name}
        submitLabel={t("common.save")}
        onCancel={() => setMode("idle")}
        onSubmit={async (next) => {
          const result = await renameCookbook(id, next);
          if ("ok" in result) {
            setMode("idle");
            router.refresh();
          }
          return result;
        }}
      />
    );
  }

  const remove = () =>
    startTransition(async () => {
      const result = await deleteCookbook(id);
      if ("error" in result) return setError(result.error);
      router.replace("/account");
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {mode === "deleting" ? (
          <>
            <span className="text-amber-900">{t("cookbook.confirmDelete")}</span>
            <Button variant="destructive" loading={pending} onClick={remove}>{t("cookbook.yesDelete")}</Button>
            <Button variant="ghost" onClick={() => setMode("idle")}>{t("common.no")}</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setMode("renaming")}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("cookbook.rename")}
            </Button>
            <Button variant="ghost" onClick={() => setMode("deleting")}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("cookbook.delete")}
            </Button>
          </>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
