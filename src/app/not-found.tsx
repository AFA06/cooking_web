import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <SiteShell>
      <Container size="sm" className="py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">404</p>
        <h1 className="mt-3 text-4xl font-medium text-amber-950 sm:text-5xl">Sahifa topilmadi</h1>
        <p className="mt-4 text-amber-900">Siz izlagan sahifa mavjud emas yoki ko‘chirilgan.</p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/recipes">Retseptlarga o‘tish</Link>
        </Button>
      </Container>
    </SiteShell>
  );
}
