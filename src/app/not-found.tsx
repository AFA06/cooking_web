import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <SiteShell>
      <Container size="sm" className="py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">404</p>
        <h1 className="mt-3 text-4xl font-medium text-amber-950 sm:text-5xl">{t("notFound.title")}</h1>
        <p className="mt-4 text-amber-900">{t("notFound.text")}</p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/recipes">{t("notFound.cta")}</Link>
        </Button>
      </Container>
    </SiteShell>
  );
}
