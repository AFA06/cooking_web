import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { SiteShell } from "@/components/layout/SiteShell";
import { TERMS } from "@/content/legal";

export const metadata: Metadata = {
  title: TERMS.title,
  description: TERMS.summary,
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalDocument doc={TERMS} other={{ label: "Maxfiylik siyosati", href: "/privacy" }} />
    </SiteShell>
  );
}
