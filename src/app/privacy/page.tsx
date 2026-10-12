import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { SiteShell } from "@/components/layout/SiteShell";
import { PRIVACY } from "@/content/legal";

export const metadata: Metadata = {
  title: PRIVACY.title,
  description: PRIVACY.summary,
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalDocument doc={PRIVACY} other={{ label: "Foydalanish shartlari", href: "/terms" }} />
    </SiteShell>
  );
}
