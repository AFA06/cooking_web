"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container size="sm" className="py-24 text-center">
      <h1 className="text-4xl font-medium text-amber-950">Nimadir xato ketdi</h1>
      <p className="mt-4 text-amber-900">Sahifani yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.</p>
      <Button size="lg" className="mt-8" onClick={reset}>Qayta urinish</Button>
    </Container>
  );
}
