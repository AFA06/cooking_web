"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { createBlogger, type NewBloggerState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

/** The "add creator" form. After saving it shows the sign-in details once, ready to send to the creator. */
export function NewBloggerForm({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [state, action, pending] = React.useActionState<NewBloggerState, FormData>(createBlogger, {});
  const [copied, setCopied] = React.useState(false);

  if (state.created) {
    const { creatorId, name, login, password } = state.created;
    const text = t("adm.blogger.handover", { name, login, password });
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {
        // Clipboard blocked: the text stays on screen to copy by hand.
      }
    };
    return (
      <div className="space-y-6" role="status">
        <div>
          <p className="flex items-center gap-2 font-serif text-2xl font-medium text-amber-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-500 text-ink"><Check className="h-5 w-5" aria-hidden="true" /></span>
            {t("adm.blogger.created", { name })}
          </p>
          <p className="mt-2 text-amber-600">{t("adm.login.once")}</p>
        </div>
        <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-2xl bg-amber-50 p-5 font-mono text-[0.95rem]">
          <dt className="font-sans text-amber-600">{t("adm.blogger.login")}</dt>
          <dd className="break-all text-amber-950">{login}</dd>
          <dt className="font-sans text-amber-600">{t("adm.blogger.password")}</dt>
          <dd className="break-all text-amber-950">{password}</dd>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? t("share.copied") : t("adm.blogger.copy")}
          </Button>
          <Button variant="outline" asChild><Link href={`/admin/creators/${creatorId}`}>{t("adm.blogger.open")}</Link></Button>
          <Button variant="ghost" asChild><Link href="/admin/creators">{t("adm.nav.creators")}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" autoComplete="off">
      {children}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button type="submit" loading={pending}>{t("adm.blogger.submit")}</Button>
        {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}
