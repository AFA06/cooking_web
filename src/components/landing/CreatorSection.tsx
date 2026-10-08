import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";

const POINTS = [
  "Retseptlaringizni batafsil pishirish qo‘llanmasiga aylantiring",
  "Bitta havola bilan auditoriyangizga ulashing",
  "Bepul va premium retseptlar nashr eting",
  "Qaysi havola nechta o‘quvchi keltirganini ko‘ring",
];

export function CreatorSection() {
  return (
    <section className="border-y border-amber-200 bg-amber-100/60 py-20 lg:py-28" aria-labelledby="creator-heading">
      <Container size="xl" className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/3] bg-amber-200">
          <Image
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"
            alt="Stolda tayyorlangan go‘shtli taom va ziravorlar"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">Ijodkorlar uchun</p>
          <h2 id="creator-heading" className="mt-4 text-3xl font-medium text-amber-950 sm:text-5xl">
            Auditoriyangiz retseptlaringizni allaqachon yaxshi ko‘radi. Ularga pishirishning qulay yo‘lini bering.
          </h2>
          <ul className="mt-8 divide-y divide-amber-200 border-t border-amber-200">
            {POINTS.map((p) => (
              <li key={p} className="py-3 text-amber-900">{p}</li>
            ))}
          </ul>
          <p className="mt-6 text-amber-900">
            Dastlabki {PLATFORM_CONFIG.creator.foundingCreatorCount} ta ijodkor asoschi hamkor sifatida qo‘shiladi va asoschilik davrida platforma komissiyasini to‘lamaydi.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href={PLATFORM_CONFIG.urls.becomeCreator}>Ijodkor bo‘lish</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
