import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { login } from "../actions";

export const metadata: Metadata = { title: "Kirish", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <SiteShell>
      <AuthScreen eyebrow="Kirish" title={<>Xush kelibsiz, <em className="text-clay-400">oshpaz.</em></>} note="Saqlangan retseptlaringiz va boshlagan taomlaringiz sizni kutmoqda.">
        <AuthForm mode="login" action={login} next={safe} />
      </AuthScreen>
    </SiteShell>
  );
}
