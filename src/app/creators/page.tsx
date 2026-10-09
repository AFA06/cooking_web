import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Plus, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { formatRating } from "@/components/reviews/RatingStars";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { listCreatorShowcase, type CreatorShowcase } from "@/server/recipes";

export const metadata: Metadata = {
  title: "Ijodkorlar",
  description: "Damda’da qadam-baqadam retseptlar nashr etayotgan ijodkorlar.",
  alternates: { canonical: "/creators" },
};

export const dynamic = "force-dynamic";

const stagger = "sm:even:mt-16";
const plateShadow = "shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-amber-950/15";

/** One kitchen on the table: the creator's leading dish as a slowly turning plate. */
function CreatorPlate({ creator, index }: { creator: CreatorShowcase; index: number }) {
  const [first, second] = creator.dishes;
  const initial = creator.name.slice(0, 1).toUpperCase();
  const facts = [
    `${formatNumber(creator.recipeCount)} ta retsept`,
    creator.cookedCount > 0 ? `${formatNumber(creator.cookedCount)} marta pishirilgan` : null,
  ].filter(Boolean);

  return (
    <li className={`rise ${stagger}`} style={{ animationDelay: `${index * 70}ms` }}>
      <Link href={`/creators/${creator.slug}`} className="group block rounded-[1.75rem] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-amber-950">
        <div className="relative mx-auto max-w-[24rem] lg:max-w-[min(100%,46svh)]">
          <span className="absolute left-0 top-0 z-10 font-serif text-lg text-clay-400" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            <div
              className={`plate-turn relative aspect-square overflow-hidden rounded-full bg-amber-100 ${plateShadow}`}
              style={{ animationDuration: `${130 + index * 20}s`, animationDirection: index % 2 ? "reverse" : "normal" }}
            >
              {first ? (
                <>
                  <Image src={first.url} alt={first.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  {second && (
                    <Image
                      src={second.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    />
                  )}
                </>
              ) : (
                <span className="flex h-full items-center justify-center font-serif text-8xl text-amber-600" aria-hidden="true">
                  {initial}
                </span>
              )}
            </div>
          </div>
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              alt=""
              width={96}
              height={96}
              className="absolute bottom-0 right-[4%] z-10 h-[27%] w-[27%] rounded-full object-cover ring-[5px] ring-amber-50 transition-transform duration-500 group-hover:-translate-y-1"
            />
          ) : (
            <span
              className="absolute bottom-0 right-[4%] z-10 flex h-[27%] w-[27%] items-center justify-center rounded-full bg-amber-800 font-serif text-3xl text-amber-950 ring-[5px] ring-amber-50 transition-transform duration-500 group-hover:-translate-y-1"
              aria-hidden="true"
            >
              {initial}
            </span>
          )}
          {creator.rating.count > 0 && (
            <span className="absolute bottom-1 left-0 z-10 flex items-center gap-1.5 rounded-full bg-amber-950 px-3 py-1.5 text-sm font-semibold text-amber-50">
              <Star className="h-4 w-4 fill-amber-700 text-amber-700" aria-hidden="true" />
              {formatRating(creator.rating.average)}
              <span className="sr-only">o‘rtacha baho</span>
            </span>
          )}
        </div>

        <div className="mt-7 px-1">
          {creator.isFoundingCreator && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Asoschi ijodkor</p>}
          <h2 className="mt-2 flex items-start justify-between gap-3 font-serif text-[1.7rem] font-medium leading-tight text-amber-950">
            <span className="min-w-0 break-words">{creator.name}</span>
            <ArrowUpRight className="mt-1.5 h-5 w-5 shrink-0 text-amber-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clay-400" aria-hidden="true" />
          </h2>
          {creator.bio && <p className="mt-2.5 line-clamp-2 leading-relaxed text-amber-900">{creator.bio}</p>}
          <p className="mt-4 border-t border-amber-950/15 pt-3.5 text-sm font-medium text-amber-600">{facts.join(" · ")}</p>
        </div>
      </Link>
    </li>
  );
}

/** Where each plate sits on the hero table; the first is the centrepiece. */
const PLATE_SPOTS = [
  "left-[19%] top-[20%] w-[60%]",
  "left-0 top-[3%] z-10 w-[30%]",
  "right-[1%] top-0 z-10 w-[27%]",
  "bottom-0 left-[3%] z-10 w-[28%]",
  "-right-[5%] bottom-[2%] z-10 w-[33%]",
];

export default async function CreatorsPage() {
  const creators = await listCreatorShowcase();
  const totals = [
    { value: creators.length, label: "ijodkor" },
    { value: creators.reduce((sum, c) => sum + c.recipeCount, 0), label: "retsept" },
    { value: creators.reduce((sum, c) => sum + c.cookedCount, 0), label: "marta pishirilgan" },
  ];

  // One dish per creator first, then second dishes, so the table shows every kitchen.
  const plates = [0, 1]
    .flatMap((n) => creators.filter((c) => c.dishes[n]).map((c) => ({ url: c.dishes[n].url, avatarUrl: c.avatarUrl })))
    .filter((p, i, all) => all.findIndex((o) => o.url === p.url) === i)
    .slice(0, PLATE_SPOTS.length);

  return (
    <div className="overflow-x-clip">
      <section className="relative overflow-hidden bg-amber-50 text-amber-950">
        <span className="pointer-events-none absolute -right-40 top-1/2 h-[70rem] w-[70rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(200,109,81,0.28),transparent)]" aria-hidden="true" />
        <Container size="xl" className="relative flex min-h-[calc(100svh-4rem)] flex-col pb-7 pt-10 lg:pt-12">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
            <header className="rise">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Ijodkorlar</p>
              <h1 className="mt-6 font-serif text-[2.75rem] font-medium leading-[1.02] sm:text-7xl xl:text-[6rem]">
                Har bir taom ortida — <em className="text-clay-400">bir oshxona.</em>
              </h1>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-amber-900">
                Eshikni oching: har bir ijodkorning o‘z ta’mi, o‘z uslubi va qadam-baqadam yozilgan retseptlari bor.
              </p>
              <dl className="mt-9 flex gap-8 sm:gap-12">
                {totals.map((t) => (
                  <div key={t.label}>
                    <dd className="font-serif text-4xl sm:text-5xl">{formatNumber(t.value)}</dd>
                    <dt className="mt-1 text-sm text-amber-600">{t.label}</dt>
                  </div>
                ))}
              </dl>
            </header>

            <div className="relative mx-auto aspect-square w-full max-w-[26rem] lg:mx-0 lg:h-[min(72svh,46rem)] lg:w-auto lg:max-w-none" aria-hidden="true">
              {plates.map((p, i) => (
                <div key={p.url} className={`rise absolute ${PLATE_SPOTS[i]}`} style={{ animationDelay: `${150 + i * 110}ms` }}>
                  <div
                    className={`plate-turn relative aspect-square overflow-hidden rounded-full ${plateShadow}`}
                    style={{ animationDuration: `${110 + i * 25}s`, animationDirection: i % 2 ? "reverse" : "normal" }}
                  >
                    <Image src={p.url} alt="" fill sizes="(min-width: 1024px) 30vw, 60vw" priority={i === 0} className="object-cover" />
                  </div>
                  {p.avatarUrl && (
                    <Image src={p.avatarUrl} alt="" width={56} height={56} className="absolute bottom-[4%] right-[4%] h-[22%] min-h-9 w-[22%] min-w-9 rounded-full object-cover ring-[3px] ring-amber-50" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <a href="#oshxonalar" className="group mt-8 flex items-center justify-between gap-6 border-t border-amber-950/15 pt-6">
            <span className="flex items-center">
              {creators.slice(0, 5).map((c) =>
                c.avatarUrl ? (
                  <Image key={c.id} src={c.avatarUrl} alt="" width={48} height={48} className="-ml-2.5 h-12 w-12 rounded-full object-cover ring-[3px] ring-amber-50 first:ml-0" />
                ) : (
                  <span key={c.id} className="-ml-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-800 font-serif text-lg text-amber-950 ring-[3px] ring-amber-50 first:ml-0" aria-hidden="true">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                ),
              )}
            </span>
            <span className="flex items-center gap-3 text-[0.95rem] font-semibold">
              Oshxonalarga kirish
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-950 text-amber-50 transition-transform duration-300 group-hover:translate-y-1">
                <ArrowDown className="h-5 w-5" aria-hidden="true" />
              </span>
            </span>
          </a>
        </Container>
      </section>

      <section id="oshxonalar" className="scroll-mt-16 bg-amber-50 text-amber-950">
        <Container size="xl" className="pb-24 pt-12 lg:pb-32 lg:pt-14">
          <ul className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12 lg:gap-y-24">
            {creators.map((c, i) => (
              <CreatorPlate key={c.id} creator={c} index={i} />
            ))}
            <li className={stagger}>
              <Link href={PLATFORM_CONFIG.urls.becomeCreator} className="group block">
                <span className="mx-auto flex aspect-square max-w-[24rem] flex-col items-center justify-center rounded-full border-2 border-dashed border-amber-950/25 px-8 text-center transition-colors duration-300 group-hover:border-clay-400 lg:max-w-[min(100%,46svh)]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 text-amber-50 transition-transform duration-500 group-hover:rotate-90">
                    <Plus className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="mt-5 font-serif text-2xl font-medium leading-tight">Keyingi likopcha — sizniki</span>
                </span>
                <span className="mt-7 block px-1">
                  <span className="block leading-relaxed text-amber-900">Retseptlaringizni qadam-baqadam nashr eting va dasturxonga qo‘shiling.</span>
                  <span className="mt-4 block border-t border-amber-950/15 pt-3.5 text-sm font-semibold text-clay-400">Ijodkor bo‘lish</span>
                </span>
              </Link>
            </li>
          </ul>

          <p className="mt-20 text-sm text-amber-500">Ayrim profillar namuna sifatida ko‘rsatilgan.</p>
        </Container>
      </section>
    </div>
  );
}
