import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";

export function Hero() {
  return (
    <section className="pt-24 pb-16 lg:pt-32 lg:pb-24" aria-labelledby="hero-heading">
      <Container size="xl" className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">Qadam-baqadam pazandalik</p>
          <h1 id="hero-heading" className="text-[2.6rem] leading-[1.05] font-medium text-amber-950 sm:text-6xl lg:text-7xl">
            Pishirayotganda <em className="not-italic text-amber-700">YouTube’ga</em> qaytmang.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-amber-900 sm:text-xl">
            Sevimli ijodkorlaringizning retseptlari — birinchi masalliqdan tayyor taomgacha, har bir qadamda aniq ko‘rsatma bilan.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="xl" asChild>
              <Link href={PLATFORM_CONFIG.urls.recipes}>Retseptlarni ko‘rish</Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href={PLATFORM_CONFIG.urls.becomeCreator}>Ijodkor bo‘lish</Link>
            </Button>
          </div>
          <p className="mt-6 max-w-md text-sm text-amber-600">
            Bepul retseptlar mavjud. Premium retseptlar batafsil ko‘rsatma, taymer va ijodkor maslahatlarini beradi.
          </p>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-amber-100 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=1400&q=80"
              alt="Lagan idishda tayyor o‘zbek oshi"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 border border-amber-200 bg-white p-5 sm:left-auto sm:right-6 sm:w-80">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Qadam 4 / 8 · Osh</p>
            <p className="mt-2 font-serif text-xl leading-snug text-amber-950">Piyozni o‘rtacha olovda qovuring.</p>
            <div className="mt-3 flex items-center justify-between border-t border-amber-200 pt-3">
              <span className="font-mono text-2xl tabular-nums text-amber-950">07:00</span>
              <span className="text-sm font-semibold text-amber-700">Keyingi →</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
