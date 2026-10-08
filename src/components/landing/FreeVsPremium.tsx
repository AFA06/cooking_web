import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";

const FREE = ["To‘liq masalliqlar ro‘yxati", "Barcha qadamlar matni", "Qadam-baqadam pishirish rejimi", "Saqlash va pishirish tarixi"];
const PREMIUM = [
  "Bepul retseptdagi hamma narsa",
  "Ijodkorning batafsil izohlari va maslahatlari",
  "Har bir qadam uchun taymer va harorat",
  "Keng tarqalgan xatolar va ularning oldini olish",
  "Ijodkorni qo‘llab-quvvatlaydi",
];

function List({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="mt-6 divide-y divide-amber-200 border-t border-amber-200">
      {items.map((t) => (
        <li key={t} className="flex gap-3 py-3">
          <svg className={`mt-1 h-4 w-4 shrink-0 ${accent ? "text-amber-700" : "text-emerald-700"}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
          {t}
        </li>
      ))}
    </ul>
  );
}

export function FreeVsPremium() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="plans-heading">
      <Container size="xl">
        <h2 id="plans-heading" className="max-w-3xl text-3xl font-medium text-amber-950 sm:text-5xl">Bepul va premium: halol farq.</h2>
        <p className="mt-4 max-w-2xl text-lg text-amber-900">Bepul retseptlar to‘liq ishlaydi. Premium esa ijodkorning chuqurroq tajribasini beradi.</p>
        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="bg-white p-7 sm:p-10 border border-amber-200">
            <h3 className="text-2xl font-medium">Bepul retseptlar</h3>
            <p className="mt-1 text-amber-600">Hamma uchun</p>
            <List items={FREE} />
            <Button variant="outline" size="lg" className="mt-8" asChild>
              <Link href={PLATFORM_CONFIG.urls.recipes}>Bepul retseptlarni ko‘rish</Link>
            </Button>
          </div>
          <div className="bg-amber-100 p-7 sm:p-10 border border-amber-700">
            <h3 className="text-2xl font-medium">Premium retseptlar</h3>
            <p className="mt-1 text-amber-700">Narxi ijodkor tomonidan belgilanadi</p>
            <List items={PREMIUM} accent />
            <p className="mt-6 text-sm text-amber-600">To‘lov tizimi hozircha ulanmagan — premium retseptlarni ochish tez orada.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
