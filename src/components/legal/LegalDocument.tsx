import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LEGAL, type LegalDoc } from "@/content/legal";

const DATE = new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "long", year: "numeric" });

interface Props {
  doc: LegalDoc;
  /** The sibling document, linked at the bottom. */
  other: { label: string; href: string };
}

/** One layout for every legal text: a contents list beside the reading column, anchored sections. */
export function LegalDocument({ doc, other }: Props) {
  const updated = DATE.format(new Date(`${LEGAL.updatedAt}T00:00:00`));

  return (
    <Container size="xl" className="grid gap-10 py-12 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-20 lg:py-16">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Hujjat</p>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.08] text-amber-950 sm:text-5xl">{doc.title}</h1>
        <p className="mt-4 text-sm text-amber-600">Oxirgi yangilanish: {updated}</p>
        <nav aria-label="Mundarija" className="mt-8 hidden lg:block">
          <ol className="space-y-2 border-l border-amber-200 pl-4 text-sm">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-amber-900 transition-colors hover:text-clay-400">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <article className="max-w-2xl">
        <p className="text-lg leading-relaxed text-amber-900">{doc.summary}</p>

        {LEGAL.isDraft && (
          <p role="note" className="mt-6 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900">
            Bu hujjatning namunaviy matni; yakuniy yuridik matn e’lon qilinishidan oldin almashtiriladi.
          </p>
        )}

        <nav aria-label="Mundarija" className="mt-8 rounded-2xl bg-amber-100/60 p-5 lg:hidden">
          <p className="text-sm font-semibold text-amber-950">Mundarija</p>
          <ol className="mt-3 space-y-2 text-sm">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-amber-900 underline underline-offset-4">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 divide-y divide-amber-200">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28 py-8 first:pt-0">
              <h2 id={`${s.id}-h`} className="font-serif text-2xl font-medium text-amber-950">{s.title}</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-amber-900">
                {s.body.map((block, i) =>
                  typeof block === "string" ? (
                    <p key={i}>{block}</p>
                  ) : (
                    <ul key={i} className="list-disc space-y-2 pl-5 marker:text-clay-400">
                      {block.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-6 border-t border-amber-200 pt-6 text-sm text-amber-600">
          Savollaringiz bormi? <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-amber-700 underline underline-offset-4">{LEGAL.contactEmail}</a>
          {" · "}
          <Link href={other.href} className="font-semibold text-amber-700 underline underline-offset-4">{other.label}</Link>
        </p>
      </article>
    </Container>
  );
}
