"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useT } from "@/i18n/client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <Container size="sm" className="py-24 text-center">
      <h1 className="text-4xl font-medium text-amber-950">{t("error.title")}</h1>
      <p className="mt-4 text-amber-900">{t("error.text")}</p>
      <Button size="lg" className="mt-8" onClick={reset}>{t("error.retry")}</Button>
    </Container>
  );
}
