import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <SiteShell>
      <Container size="sm" className="py-12 sm:py-16">
        <h1 className="text-3xl font-medium text-amber-950 sm:text-5xl">Maxfiylik siyosati</h1>
        <p className="mt-4 border-l-2 border-amber-700 pl-4 text-amber-900">
          Bu qoralama shablon bo‘lib, ishga tushirishdan oldin yakuniy matn bilan almashtiriladi. Bu yuridik maslahat emas.
        </p>
        <div className="mt-8 space-y-6 leading-relaxed text-amber-900">
          <section>
            <h2 className="text-xl font-medium text-amber-950">Biz nimalarni yig‘amiz</h2>
            <p className="mt-2">Hisob yaratganingizda ismingiz, email manzilingiz va shifrlangan parolingiz saqlanadi. Shuningdek, saqlagan retseptlaringiz va pishirish tarixingiz saqlanadi.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">Ulardan qanday foydalanamiz</h2>
            <p className="mt-2">Ma’lumotlar hisobingizni yuritish, saqlangan retseptlar va tarixni ko‘rsatish hamda {PLATFORM_CONFIG.name}ni yaxshilash uchun ishlatiladi. Shaxsiy ma’lumotlaringizni sotmaymiz.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">Cookie fayllar</h2>
            <p className="mt-2">Tizimda qolishingiz uchun bitta sessiya cookie’sidan foydalanamiz.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">Sizning tanlovingiz</h2>
            <p className="mt-2">Ma’lumotlarga kirish va ularni o‘chirish so‘rovlari uchun aloqa ma’lumotlari ishga tushirishdan oldin shu yerga qo‘shiladi.</p>
          </section>
        </div>
      </Container>
    </SiteShell>
  );
}
