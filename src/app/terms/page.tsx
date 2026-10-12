import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { SiteShell } from "@/components/layout/SiteShell";
import { TERMS } from "@/content/legal";
import { getLocale, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const doc = TERMS[await getLocale()];
  return { title: doc.title, description: doc.summary, alternates: { canonical: "/terms" } };
}

export default async function Page() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  return (
    <SiteShell>
      <LegalDocument doc={TERMS[locale]} other={{ label: t("nav.privacy"), href: "/privacy" }} />
    </SiteShell>
  );
}
