import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";

export function FinalCTA() {
  return (
    <section className="bg-amber-700 text-white" aria-labelledby="final-heading">
      <Container size="xl" className="grid gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div>
          <h2 id="final-heading" className="text-3xl font-medium sm:text-5xl">Biror narsa pishirishga tayyormisiz?</h2>
          <Button size="xl" className="mt-8 bg-white text-amber-950 hover:bg-amber-100" asChild>
            <Link href={PLATFORM_CONFIG.urls.recipes}>Retseptlarni ko‘rish</Link>
          </Button>
        </div>
        <div className="lg:border-l lg:border-white/30 lg:pl-20">
          <h2 className="text-2xl font-medium sm:text-3xl">Odamlar yaxshi ko‘radigan retseptlaringiz bormi?</h2>
          <p className="mt-3 text-white/90">Ularni auditoriyangiz haqiqatan pishira oladigan qo‘llanmaga aylantiring.</p>
          <Button size="xl" variant="outline" className="mt-8 border-white text-white hover:bg-white/10" asChild>
            <Link href={PLATFORM_CONFIG.urls.becomeCreator}>Ijodkor bo‘lish</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
