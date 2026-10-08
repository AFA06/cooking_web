import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";

const STEPS = [
  { title: "Retsept toping", text: "Ijodkorlar retseptlarini ko‘ring, qidiring va o‘zingizga yoqqanini tanlang." },
  { title: "Masalliqlarni tayyorlang", text: "Barcha masalliq va aniq miqdorlar bir joyda — hech narsani unutmaysiz." },
  { title: "Qadam-baqadam pishiring", text: "Har bir qadam katta matn va kerak joyda taymer bilan ko‘rsatiladi." },
  { title: "Ishonch bilan yakunlang", text: "Taom tayyor. Keyingi safar xuddi shu retseptga qaytish oson." },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="how-heading">
      <Container size="xl">
        <h2 id="how-heading" className="text-3xl font-medium text-amber-950 sm:text-5xl">Qanday ishlaydi</h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-amber-950 pt-5">
              <span className="font-serif text-5xl text-amber-700">{i + 1}</span>
              <h3 className="mt-4 text-xl font-medium text-amber-950">{s.title}</h3>
              <p className="mt-2 text-amber-900">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link href={PLATFORM_CONFIG.urls.recipes}>O‘zingiz sinab ko‘ring →</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
