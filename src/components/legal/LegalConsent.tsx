"use client";

import * as React from "react";
import Link from "next/link";
import { useT } from "@/i18n/client";

/** Required tick box on the sign-up form: the account is only made after both documents are accepted. */
export function LegalConsent() {
  const t = useT();
  // Controlled, so a failed submit (which resets the form) does not untick it.
  const [checked, setChecked] = React.useState(false);
  const link = "font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800";
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-amber-700">
      <input type="checkbox" name="terms" value="yes" required checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-amber-700" />
      <span>
        {t("legal.agree.before")}{" "}
        <Link href="/terms" target="_blank" className={link}>{t("legal.agree.terms")}</Link> {t("legal.and")}{" "}
        <Link href="/privacy" target="_blank" className={link}>{t("legal.agree.privacy")}</Link>
        {t("legal.agree.after")}
      </span>
    </label>
  );
}
