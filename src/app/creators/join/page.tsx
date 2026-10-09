import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowRight, Timer } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { CreatorProfileForm } from "@/components/dashboard/CreatorProfileForm";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { formatClock } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { getFeaturedRecipes, listPublishedRecipes } from "@/server/recipes";
import type { Recipe } from "@/types/recipe";

export const metadata: Metadata = {
  title: "Ijodkor bo‘lish",
  description: "Retseptlaringizni auditoriyangiz haqiqatan pishira oladigan qo‘llanmaga aylantiring.",
  alternates: { canonical: "/creators/join" },
};
export const dynamic = "force-dynamic";

const { foundingCreatorCount, foundingCommissionRate } = PLATFORM_CONFIG.creator;

const TERMS = [
  { figure: String(foundingCreatorCount), title: "Asoschi ijodkorlar", text: `Dastlabki ${foundingCreatorCount} ta ijodkor asoschi hamkor sifatida qo‘shiladi.` },
  { figure: `${foundingCommissionRate * 100}%`, title: "Platforma komissiyasi", text: "Asoschilar davrida platforma komissiyasi olinmaydi." },
  { figure: "1", title: "Bitta havola", text: "Retseptingiz bitta havolada: auditoriyangiz uni ochadi va siz bilan birga pishiradi." },
];

const STEPS = [
  { title: "Profil oching", text: "Ism va qisqa tanishtiruv yetarli. Ijtimoiy tarmoqlaringizni keyin qo‘shasiz." },
  { title: "Retseptni qadamlarga bo‘ling", text: "Masalliqlar, har bir qadam, kerak joyda taymer va maslahat. Bepul yoki premium — o‘zingiz tanlaysiz." },
  { title: "Havolani ulashing", text: "Odamlar videoni ortga qaytarmasdan, ekrandagi qadamlar bo‘yicha pishiradi." },
];

const primaryCta = "inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-clay-400 px-6 text-base sm:px-8 sm:text-lg font-semibold text-amber-950 transition-colors duration-200 hover:bg-amber-50";
const quietCta = "inline-flex h-14 items-center justify-center rounded-full border border-amber-50/25 px-8 text-lg font-semibold text-amber-50 transition-colors duration-200 hover:border-amber-50";

/** A real recipe shown the way cooks will see it: one step at a time. */
function StepDeck({ recipe }: { recipe: Recipe }) {
  const steps = recipe.steps.slice(0, 3);
  const tilt = ["rotate-[-3deg]", "translate-x-[7%] translate-y-[5%] rotate-[4deg]", "translate-x-[13%] translate-y-[10%] rotate-[9deg]"];
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[22rem] lg:mx-0 lg:h-[min(66svh,36rem)] lg:w-auto lg:max-w-none" aria-hidden="true">
      {steps
        .map((step, i) => (
          <div
            key={step.id}
            className={`rise absolute inset-0 flex flex-col rounded-[2rem] p-7 shadow-[0_40px_70px_-30px_rgba(0,0,0,0.8)] ${tilt[i]} ${i === 0 ? "bg-amber-50 text-amber-950" : i === 1 ? "bg-amber-200" : "bg-clay-400"}`}
            style={{ animationDelay: `${(steps.length - i) * 130}ms`, zIndex: steps.length - i }}
          >
            {i === 0 && (
              <>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="uppercase tracking-[0.16em] text-amber-700">
                    {step.order}-qadam <span className="text-amber-500">/ {recipe.steps.length}</span>
                  </span>
                  {step.timerSeconds ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-950 px-3 py-1.5 text-amber-50">
                      <Timer className="h-4 w-4" />
                      {formatClock(step.timerSeconds)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-6 font-serif text-[1.9rem] font-medium leading-[1.1]">{step.title}</p>
                <p className="mt-4 line-clamp-3 text-[1.05rem] leading-relaxed text-amber-900">{step.instruction}</p>
                <div className="flex min-h-0 flex-1 items-center justify-center py-5">
                  <div className="plate-turn relative aspect-square h-full max-h-56 overflow-hidden rounded-full shadow-[0_20px_40px_-18px_rgba(44,40,37,0.6)]">
                    <Image src={recipe.coverMedia.url} alt="" fill sizes="224px" priority className="object-cover" />
                  </div>
                </div>
                <div className="border-t border-amber-200 pt-4">
                  <span className="block truncate font-semibold">{recipe.title}</span>
                  <span className="block truncate text-sm text-amber-600">{recipe.creator.name}</span>
                </div>
              </>
            )}
          </div>
        ))
        .reverse()}
    </div>
  );
}

export default async function JoinPage() {
  const user = await getCurrentUser();
  if (user && (await getCreatorForUser(user.id))) redirect("/dashboard");

  const [featured] = await getFeaturedRecipes(1);
  const sample = featured ?? (await listPublishedRecipes())[0];

  return (
    <div className="overflow-x-clip bg-amber-950 text-amber-50">
      <section className="relative">
        <span className="pointer-events-none absolute -right-40 top-1/2 h-[70rem] w-[70rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(200,109,81,0.28),transparent)]" aria-hidden="true" />
        <Container size="xl" className="relative flex min-h-[calc(100svh-4rem)] flex-col pb-7 pt-10 lg:pt-12">
          <div className="grid flex-1 items-center gap-16 lg:grid-cols-[1fr_auto] lg:gap-24 lg:pr-16">
            <header className="rise">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Ijodkor bo‘lish</p>
              <h1 className="mt-6 font-serif text-[2.75rem] font-medium leading-[1.02] sm:text-7xl xl:text-[6rem]">
                Retseptingiz endi — <em className="text-clay-400">qo‘llanma.</em>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-amber-200">
                Retseptlaringizni masalliq, taymer va maslahatlar bilan qadam-baqadam nashr eting, bitta havolani auditoriyangizga ulashing va premium
                retseptlar taklif qiling.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <a href="#boshlash" className={primaryCta}>
                    Profil yaratish
                    <ArrowDown className="h-5 w-5" aria-hidden="true" />
                  </a>
                ) : (
                  <>
                    <Link href="/auth/signup?next=/creators/join" className={primaryCta}>
                      Boshlash uchun hisob yarating
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <Link href="/auth/login?next=/creators/join" className={quietCta}>
                      Hisobim bor
                    </Link>
                  </>
                )}
              </div>
            </header>
            {sample && sample.steps.length > 0 && <StepDeck recipe={sample} />}
          </div>
          <p className="mt-10 border-t border-amber-50/15 pt-6 text-sm text-amber-300">
            O‘ngdagi karta — haqiqiy retseptning birinchi qadami. Sizning retseptingiz ham xuddi shunday ochiladi.
          </p>
        </Container>
      </section>

      <section aria-label="Shartlar" className="border-t border-amber-50/15">
        <Container size="xl" className="grid gap-12 py-20 md:grid-cols-3 md:gap-10 lg:py-28">
          {TERMS.map((t) => (
            <div key={t.title}>
              <p className="font-serif text-[5.5rem] leading-none text-clay-400 lg:text-[8rem]">{t.figure}</p>
              <h2 className="mt-6 font-serif text-2xl font-medium">{t.title}</h2>
              <p className="mt-2.5 max-w-sm leading-relaxed text-amber-200">{t.text}</p>
            </div>
          ))}
        </Container>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-amber-50/15">
        <Container size="xl" className="grid gap-12 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:py-28">
          <h2 id="how-heading" className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
            Uch qadam, <em className="text-clay-400">xuddi retseptdek.</em>
          </h2>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-amber-50/15 py-7 first:border-t-0 first:pt-0 sm:grid-cols-[5rem_1fr]">
                <span className="font-serif text-3xl text-clay-400" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-medium">{s.title}</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-amber-200">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="boshlash" className="scroll-mt-16 pb-20 lg:pb-28">
        <Container size="xl">
          <div className="grid gap-10 rounded-[2rem] bg-amber-50 p-7 text-amber-950 sm:p-12 lg:grid-cols-2 lg:gap-20 lg:p-16">
            <div>
              <h2 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">Oshxonangiz eshigini oching.</h2>
              <p className="mt-5 max-w-md leading-relaxed text-amber-900">
                Premium retseptlarni hozir nashr etish mumkin, lekin to‘lov tizimi ulanmaguncha o‘quvchilar ularni sotib ola olmaydi.
              </p>
            </div>
            {user ? (
              <CreatorProfileForm defaultName={user.name} />
            ) : (
              <div className="flex flex-col justify-center gap-3">
                <Link href="/auth/signup?next=/creators/join" className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-amber-950 px-6 text-base sm:px-8 sm:text-lg font-semibold text-amber-50 transition-colors duration-200 hover:bg-amber-700">
                  Boshlash uchun hisob yarating
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link href="/auth/login?next=/creators/join" className="inline-flex h-14 items-center justify-center rounded-full border border-amber-300 px-8 text-lg font-semibold transition-colors duration-200 hover:border-amber-950">
                  Hisobim bor
                </Link>
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
