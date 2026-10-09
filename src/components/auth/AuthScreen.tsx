import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getFeaturedRecipes, listPublishedRecipes } from "@/server/recipes";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  note: string;
  children: React.ReactNode;
}

/** Sign-in and sign-up share one screen: the form on the left, a real dish turning on the right. */
export async function AuthScreen({ eyebrow, title, note, children }: Props) {
  const [featured] = await getFeaturedRecipes(1);
  const dish = featured ?? (await listPublishedRecipes())[0];

  return (
    <section className="relative overflow-hidden">
      <span className="pointer-events-none absolute -right-40 top-1/2 hidden h-[70rem] w-[70rem] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(200,109,81,0.28),transparent)] lg:block" aria-hidden="true" />
      <Container size="xl" className="relative grid min-h-[calc(100svh-4rem)] items-center gap-16 py-12 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-24 lg:py-16">
        <div className="rise mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{eyebrow}</p>
          <h1 className="mt-5 font-serif text-[2.75rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-amber-900">{note}</p>
          {children}
        </div>

        {dish && (
          <div className="relative hidden h-full min-h-[30rem] lg:block">
            <div className="rise absolute left-[8%] top-1/2 aspect-square h-[min(96svh,62rem)] -translate-y-1/2" style={{ animationDelay: "150ms" }}>
              <div className="plate-turn relative h-full w-full overflow-hidden rounded-full shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-amber-950/15">
                <Image src={dish.coverMedia.url} alt="" fill priority sizes="60vw" className="object-cover" />
              </div>
            </div>
            <Link
              href={`/recipes/${dish.slug}`}
              className="theme-light absolute bottom-0 left-0 max-w-[18rem] rounded-2xl bg-amber-50 px-5 py-4 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Bugungi tavsiya</span>
              <span className="mt-1.5 block font-serif text-xl font-medium leading-tight text-amber-950">{dish.title}</span>
              <span className="mt-1 block text-sm text-amber-600">{dish.creator.name}</span>
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
