import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus, Star } from "lucide-react";
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

/** Every kitchen is a doorway: the arch frames the creator's leading dish. */
const arch = "relative aspect-[4/5] overflow-hidden rounded-[50%_50%_1.75rem_1.75rem/40%_40%_1.75rem_1.75rem]";
const stagger = "sm:even:mt-16 lg:even:mt-24";

function CreatorDoor({ creator, index }: { creator: CreatorShowcase; index: number }) {
  const [first, second] = creator.dishes;
  const facts = [
    `${formatNumber(creator.recipeCount)} ta retsept`,
    creator.cookedCount > 0 ? `${formatNumber(creator.cookedCount)} marta pishirilgan` : null,
  ].filter(Boolean);

  return (
    <li className={`rise ${stagger}`} style={{ animationDelay: `${index * 70}ms` }}>
      <Link href={`/creators/${creator.slug}`} className="group block rounded-[1.75rem] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-amber-950">
        <div className="relative">
          <span className="absolute left-0 top-0 z-10 font-serif text-lg text-amber-600" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className={`${arch} bg-sage-100`}>
            {first ? (
              <>
                <Image
                  src={first.url}
                  alt={first.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  priority={index < 4}
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                {second && (
                  <Image
                    src={second.url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  />
                )}
                <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-amber-950/45 to-transparent" aria-hidden="true" />
              </>
            ) : (
              <span className="flex h-full items-center justify-center font-serif text-8xl text-sage-600" aria-hidden="true">
                {creator.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            {creator.rating.count > 0 && (
              <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-950">
                <Star className="h-4 w-4 fill-amber-700 text-amber-700" aria-hidden="true" />
                {formatRating(creator.rating.average)}
                <span className="sr-only">o‘rtacha baho</span>
              </span>
            )}
          </div>
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              alt=""
              width={96}
              height={96}
              className="absolute -bottom-9 left-5 h-[4.5rem] w-[4.5rem] rounded-full object-cover ring-[5px] ring-amber-50 transition-transform duration-500 group-hover:-translate-y-1 sm:h-24 sm:w-24"
            />
          ) : (
            <span
              className="absolute -bottom-9 left-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-amber-950 font-serif text-3xl text-amber-50 ring-[5px] ring-amber-50 transition-transform duration-500 group-hover:-translate-y-1 sm:h-24 sm:w-24"
              aria-hidden="true"
            >
              {creator.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="mt-14 px-1">
          {creator.isFoundingCreator && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Asoschi ijodkor</p>}
          <h2 className="mt-2 flex items-start justify-between gap-3 font-serif text-[1.7rem] font-medium leading-tight text-amber-950">
            <span className="min-w-0 break-words">{creator.name}</span>
            <ArrowUpRight className="mt-1.5 h-5 w-5 shrink-0 text-amber-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-950" aria-hidden="true" />
          </h2>
          {creator.bio && <p className="mt-2.5 line-clamp-2 leading-relaxed text-amber-900">{creator.bio}</p>}
          <p className="mt-4 border-t border-amber-200 pt-3.5 text-sm font-medium text-amber-800">{facts.join(" · ")}</p>
        </div>
      </Link>
    </li>
  );
}

export default async function CreatorsPage() {
  const creators = await listCreatorShowcase();
  const totals = [
    { value: creators.length, label: "ijodkor" },
    { value: creators.reduce((sum, c) => sum + c.recipeCount, 0), label: "retsept" },
    { value: creators.reduce((sum, c) => sum + c.cookedCount, 0), label: "marta pishirilgan" },
  ];

  return (
    <div className="overflow-x-clip pb-24 lg:pb-32">
      <Container size="xl" className="pt-12 lg:pt-20">
        <header className="grid gap-10 border-b border-amber-200 pb-12 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-20 lg:pb-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Ijodkorlar</p>
            <h1 className="mt-5 font-serif text-[2.75rem] font-medium leading-[1.02] text-amber-950 sm:text-7xl xl:text-[5.5rem]">
              Har bir taom ortida — <em className="text-amber-700">bir oshxona.</em>
            </h1>
          </div>
          <div>
            <p className="max-w-md text-lg leading-relaxed text-amber-900">
              Eshikni oching: har bir ijodkorning o‘z ta’mi, o‘z uslubi va qadam-baqadam yozilgan retseptlari bor.
            </p>
            <dl className="mt-8 flex gap-8 sm:gap-12">
              {totals.map((t) => (
                <div key={t.label}>
                  <dd className="font-serif text-4xl text-amber-950 sm:text-5xl">{formatNumber(t.value)}</dd>
                  <dt className="mt-1 text-sm text-amber-800">{t.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <ul className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-20">
          {creators.map((c, i) => (
            <CreatorDoor key={c.id} creator={c} index={i} />
          ))}
          <li className={stagger}>
            <Link
              href={PLATFORM_CONFIG.urls.becomeCreator}
              className={`${arch} group flex flex-col items-center justify-center border-2 border-dashed border-amber-300 px-8 text-center transition-colors duration-300 hover:border-amber-950 hover:bg-amber-100`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-950 text-amber-50 transition-transform duration-500 group-hover:rotate-90">
                <Plus className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="mt-6 font-serif text-2xl font-medium leading-tight text-amber-950">Keyingi eshik — sizniki</span>
              <span className="mt-3 text-amber-900">Retseptlaringizni qadam-baqadam nashr eting.</span>
              <span className="mt-5 text-sm font-semibold text-amber-700 underline underline-offset-4">Ijodkor bo‘lish</span>
            </Link>
          </li>
        </ul>

        <p className="mt-20 text-sm text-amber-600">Ayrim profillar namuna sifatida ko‘rsatilgan.</p>
      </Container>
    </div>
  );
}
