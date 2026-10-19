import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowRight, Clock, Timer } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/core";
import { formatClock } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { getFeaturedRecipes, listPublishedRecipes } from "@/server/recipes";
import { getMyApplication } from "@/server/applications";
import { ApplicationForm } from "@/components/creator/ApplicationForm";
import { formatPhone } from "@/lib/profile";
import type { Recipe } from "@/types/recipe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.becomeCreator"), description: t("join.desc"), alternates: { canonical: "/creators/join" } };
}
export const dynamic = "force-dynamic";

const { foundingCreatorCount, foundingCommissionRate } = PLATFORM_CONFIG.creator;

const TERMS = (t: TFunction) => [
  { figure: String(foundingCreatorCount), title: t("join.term1.title"), text: t("join.term1.text", { count: foundingCreatorCount }) },
  { figure: `${foundingCommissionRate * 100}%`, title: t("join.term2.title"), text: t("join.term2.text") },
  { figure: "1", title: t("join.term3.title"), text: t("join.term3.text") },
];

const STEPS = (t: TFunction) => [
  { title: t("join.step1.title"), text: t("join.step1.text") },
  { title: t("join.step2.title"), text: t("join.step2.text") },
  { title: t("join.step3.title"), text: t("join.step3.text") },
];

const primaryCta = "inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-clay-400 px-6 text-base sm:px-8 sm:text-lg font-semibold text-amber-50 transition-colors duration-200 hover:bg-amber-950";

/** A real recipe shown the way cooks will see it: one step at a time. */
function StepDeck({ recipe, t }: { recipe: Recipe; t: TFunction }) {
  const steps = recipe.steps.slice(0, 3);
  const tilt = ["rotate-[-3deg]", "translate-x-[7%] translate-y-[5%] rotate-[4deg]", "translate-x-[13%] translate-y-[10%] rotate-[9deg]"];
  return (
    <div className="theme-light relative mx-auto aspect-[4/5] w-full max-w-[22rem] lg:mx-0 lg:h-[min(66svh,36rem)] lg:w-auto lg:max-w-none" aria-hidden="true">
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
                    {t("join.deckStep", { n: step.order })} <span className="text-amber-500">/ {recipe.steps.length}</span>
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
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (user && (await getCreatorForUser(user.id))) redirect("/dashboard");
  const application = user ? await getMyApplication(user.id) : null;
  const pending = application?.status === "pending";
  // Visitors without an account first sign up quickly, then come straight back to the form.
  const applyHref = user ? "#ariza" : `/auth/signup?next=${encodeURIComponent("/creators/join#ariza")}`;

  const [featured] = await getFeaturedRecipes(1);
  const sample = featured ?? (await listPublishedRecipes())[0];

  return (
    <div className="overflow-x-clip bg-amber-50 text-amber-950">
      <section className="relative">
        <span className="pointer-events-none absolute -right-40 top-1/2 h-[70rem] w-[70rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(200,109,81,0.28),transparent)]" aria-hidden="true" />
        <Container size="xl" className="relative flex min-h-[calc(100svh-4rem)] flex-col pb-7 pt-10 lg:pt-12">
          <div className="grid grid-cols-1 flex-1 items-center gap-16 lg:grid-cols-[1fr_auto] lg:gap-24 lg:pr-16">
            <header className="rise">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{t("nav.becomeCreator")}</p>
              <h1 className="mt-6 font-serif text-[2.75rem] font-medium leading-[1.02] sm:text-7xl xl:text-[6rem]">
                {t("join.heroLead")} <em className="text-clay-400">{t("join.heroEm")}</em>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-amber-900">
                {t("join.heroText")}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                {pending ? (
                  <a href="#ariza" className={primaryCta}>
                    <Clock className="h-5 w-5" aria-hidden="true" />
                    {t("apply.pendingShort")}
                  </a>
                ) : (
                  <Link href={applyHref} className={primaryCta}>
                    {t("apply.cta")}
                    {user ? <ArrowDown className="h-5 w-5" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
                  </Link>
                )}
                {!user && <p className="max-w-xs text-sm text-amber-600">{t("apply.signupFirst")}</p>}
              </div>
            </header>
            {sample && sample.steps.length > 0 && <StepDeck recipe={sample} t={t} />}
          </div>
          <p className="mt-10 border-t border-amber-950/15 pt-6 text-sm text-amber-600">
            {t("join.deckNote")}
          </p>
        </Container>
      </section>

      <section aria-label={t("join.termsLabel")} className="border-t border-amber-950/15">
        <Container size="xl" className="grid grid-cols-1 gap-12 py-20 md:grid-cols-3 md:gap-10 lg:py-28">
          {TERMS(t).map((term) => (
            <div key={term.title}>
              <p className="font-serif text-[5.5rem] leading-none text-clay-400 lg:text-[8rem]">{term.figure}</p>
              <h2 className="mt-6 font-serif text-2xl font-medium">{term.title}</h2>
              <p className="mt-2.5 max-w-sm leading-relaxed text-amber-900">{term.text}</p>
            </div>
          ))}
        </Container>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-amber-950/15">
        <Container size="xl" className="grid grid-cols-1 gap-12 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:py-28">
          <h2 id="how-heading" className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
            {t("join.howLead")} <em className="text-clay-400">{t("join.howEm")}</em>
          </h2>
          <ol>
            {STEPS(t).map((s, i) => (
              <li key={s.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-amber-950/15 py-7 first:border-t-0 first:pt-0 sm:grid-cols-[5rem_1fr]">
                <span className="font-serif text-3xl text-clay-400" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-medium">{s.title}</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-amber-900">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="ariza" className="scroll-mt-20 pb-20 lg:pb-28">
        <Container size="xl">
          <div className="theme-light grid grid-cols-1 gap-10 rounded-[2rem] bg-amber-50 p-7 text-amber-950 sm:p-12 lg:grid-cols-[2fr_3fr] lg:gap-16 lg:p-16">
            <div>
              <h2 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{t("apply.title")}</h2>
              <p className="mt-5 max-w-md leading-relaxed text-amber-900">{t("apply.intro")}</p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-amber-700">{t("join.premiumNote")}</p>
            </div>
            {!user ? (
              <div className="flex flex-col justify-center gap-4">
                <p className="leading-relaxed text-amber-900">{t("apply.signupFirst")}</p>
                <Link href={applyHref} className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-amber-950 px-6 text-base font-semibold text-amber-50 transition-colors duration-200 hover:bg-amber-700 sm:px-8 sm:text-lg">
                  {t("apply.signupCta")}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            ) : pending ? (
              <div role="status" className="flex flex-col justify-center gap-3 rounded-2xl bg-amber-100 p-6">
                <p className="flex items-center gap-2 font-serif text-2xl font-medium"><Clock className="h-6 w-6 text-clay-400" aria-hidden="true" />{t("apply.pendingTitle")}</p>
                <p className="leading-relaxed text-amber-900">{t("apply.pendingText", { phone: formatPhone(application.phone) })}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {application?.status === "rejected" && (
                  <p role="status" className="rounded-2xl bg-clay-100 px-5 py-4 text-amber-950">
                    {t("apply.rejected")}
                    {application.adminNote && <span className="mt-1 block text-sm text-amber-800">{application.adminNote}</span>}
                  </p>
                )}
                <ApplicationForm defaultName={user.name} defaultPhone={user.phone ? formatPhone(user.phone) : ""} />
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
