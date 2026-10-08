import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Foydalanish shartlari",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <SiteShell>
      <Container size="sm" className="py-12 sm:py-16">
        <h1 className="text-3xl font-medium text-amber-950 sm:text-5xl">Foydalanish shartlari</h1>
        <p className="mt-4 border-l-2 border-amber-700 pl-4 text-amber-900">
          Bu qoralama shablon bo‘lib, ishga tushirishdan oldin yakuniy matn bilan almashtiriladi. Bu yuridik maslahat emas.
        </p>
        <div className="mt-8 space-y-6 leading-relaxed text-amber-900">
          <section>
            <h2 className="text-xl font-medium text-amber-950">1. {PLATFORM_CONFIG.name} xizmatidan foydalanish</h2>
            <p className="mt-2">Retseptlarni hisobsiz ham ko‘rishingiz mumkin. Retseptlarni saqlash va pishirish tarixi kabi imkoniyatlar uchun hisob kerak. Kirish ma’lumotlaringiz xavfsizligi uchun o‘zingiz javobgarsiz.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">2. Retseptlar va kontent</h2>
            <p className="mt-2">Retseptlarni mustaqil ijodkorlar nashr etadi va kontent ularga tegishli. Retseptlar pishirish bo‘yicha yo‘l-yo‘riq sifatida beriladi; oziq-ovqat xavfsizligiga rioya qiling va allergenlarni tekshiring.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">3. Premium retseptlar va to‘lovlar</h2>
            <p className="mt-2">Ba’zi retseptlar premium bo‘lib, ochish uchun to‘lov talab qilinadi. To‘lov shartlari, narxlar va qaytarish qoidalari to‘lov tizimi ulangach shu yerda yoziladi.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">4. Ijodkorlar</h2>
            <p className="mt-2">Ijodkorlar o‘zlari nashr etgan retseptlar uchun javobgar va ularni ulashish huquqiga ega bo‘lishi shart. Daromad shartlari shu yerda bayon etiladi.</p>
          </section>
          <section>
            <h2 className="text-xl font-medium text-amber-950">5. O‘zgarishlar</h2>
            <p className="mt-2">Biz ushbu shartlarni yangilashimiz mumkin. Xizmatdan foydalanishni davom ettirsangiz, yangilangan shartlarni qabul qilgan hisoblanasiz.</p>
          </section>
        </div>
      </Container>
    </SiteShell>
  );
}
