import { Container } from "@/components/ui/Container";

const OLD = [
  "Videoni tomosha qilasiz",
  "Oshxonaga borasiz",
  "Qadamni unutasiz",
  "Qo‘lingiz yog‘li — telefonni ushlaysiz",
  "Videoni titkilab, kerakli joyni qidirasiz",
  "Yana pishirishga qaytasiz va hammasi takrorlanadi",
];

const NEW = ["Retseptni oching", "Hozirgi qadamni o‘qing", "Kerak bo‘lsa taymerni yoqing", "“Keyingi” tugmasini bosing", "Taom tayyor"];

export function ProblemSolution() {
  return (
    <section className="border-y border-amber-200 bg-amber-100/60 py-20 lg:py-28" aria-labelledby="problem-heading">
      <Container size="xl">
        <h2 id="problem-heading" className="max-w-3xl text-3xl font-medium text-amber-950 sm:text-5xl">
          Video ko‘rish oson. Uni qo‘lingiz yog‘li holda takrorlash esa qiyin.
        </h2>
        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">Odatdagi usul</h3>
            <ol className="mt-5 divide-y divide-amber-200 border-t border-amber-200">
              {OLD.map((t, i) => (
                <li key={t} className="flex gap-4 py-3.5 text-amber-900">
                  <span className="w-6 text-amber-500 tabular-nums">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">Damda’da</h3>
            <ol className="mt-5 divide-y divide-amber-700/30 border-t border-amber-700">
              {NEW.map((t, i) => (
                <li key={t} className="flex gap-4 py-3.5 text-lg font-medium text-amber-950">
                  <span className="w-6 text-amber-700 tabular-nums">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
