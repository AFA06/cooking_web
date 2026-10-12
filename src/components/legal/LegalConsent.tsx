"use client";

import Link from "next/link";
import { useT } from "@/i18n/client";

/** Shown next to the sign-up button: using it means accepting both documents. */
export function LegalConsent() {
  const t = useT();
  const link = "font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800";
  return (
    <p className="text-sm leading-relaxed text-amber-600">
      {t("legal.consentBefore")}{" "}
      <Link href="/terms" target="_blank" className={link}>{t("legal.termsLink")}</Link> {t("legal.and")}{" "}
      <Link href="/privacy" target="_blank" className={link}>{t("legal.privacyLink")}</Link>
      {t("legal.consentAfter")}
    </p>
  );
}
