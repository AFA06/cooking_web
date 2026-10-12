import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { signup } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.signupEyebrow"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next = "" }, t] = await Promise.all([searchParams, getT()]);
  if (await getCurrentUser()) redirect("/account");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <SiteShell>
      <AuthScreen eyebrow={t("auth.signupEyebrow")} title={<>{t("auth.signupLead")} <em className="text-clay-400">{t("auth.signupEm")}</em></>} note={t("auth.signupNote")}>
        <AuthForm mode="signup" action={signup} next={safe} />
      </AuthScreen>
    </SiteShell>
  );
}
