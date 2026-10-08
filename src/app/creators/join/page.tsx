import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CreatorProfileForm } from "@/components/dashboard/CreatorProfileForm";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ijodkor bo‘lish",
  description: "Retseptlaringizni auditoriyangiz haqiqatan pishira oladigan qo‘llanmaga aylantiring.",
  alternates: { canonical: "/creators/join" },
};
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const user = await getCurrentUser();
  if (user && (await getCreatorForUser(user.id))) redirect("/dashboard");

  return (
    <Container size="sm" className="py-14 sm:py-20">
      <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Ijodkor bo‘lish</h1>
      <p className="mt-5 text-lg text-amber-800">
        Retseptlaringizni masalliq, taymer va maslahatlar bilan qadam-baqadam qo‘llanma sifatida nashr eting,
        bitta havolani auditoriyangizga ulashing va premium retseptlar taklif qiling.
      </p>
      <ul className="mt-8 space-y-3 text-amber-900 list-disc pl-5">
        <li>Dastlabki {PLATFORM_CONFIG.creator.foundingCreatorCount} ta ijodkor asoschi hamkor sifatida qo‘shiladi.</li>
        <li>Asoschilar davrida platforma komissiyasi olinmaydi.</li>
        <li>Premium retseptlarni hozir nashr etish mumkin, lekin to‘lov tizimi ulanmaguncha o‘quvchilar ularni sotib ola olmaydi.</li>
      </ul>

      {user ? (
        <CreatorProfileForm defaultName={user.name} />
      ) : (
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/signup?next=/creators/join">Boshlash uchun hisob yarating</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login?next=/creators/join">Hisobim bor</Link>
          </Button>
        </div>
      )}
    </Container>
  );
}
