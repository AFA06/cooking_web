import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { signup } from "../actions";

export const metadata: Metadata = { title: "Hisob yaratish", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <SiteShell>
      <AuthScreen eyebrow="Hisob yaratish" title={<>Dasturxonga <em className="text-clay-400">qo‘shiling.</em></>} note="Retseptlarni saqlang va pishirgan taomlaringizni kuzating.">
        <AuthForm mode="signup" action={signup} next={safe} />
      </AuthScreen>
    </SiteShell>
  );
}
