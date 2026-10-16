import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthTabs, authReason } from "@/components/auth/AuthTabs";
import { SiteShell } from "@/components/layout/SiteShell";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { startSignup } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.signupEyebrow"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next = "" }, t] = await Promise.all([searchParams, getT()]);
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (await getCurrentUser()) redirect(safe || "/account");
  const reason = await authReason(safe);

  return (
    <SiteShell>
      <AuthScreen eyebrow={t("auth.signupEyebrow")} title={<>{t("auth.signupLead")} <em className="text-clay-400">{t("auth.signupEm")}</em></>} note={t("auth.signupNoteSms")}>
        <AuthTabs active="signup" next={safe} />
        <AuthForm mode="signup" action={startSignup} next={safe} notice={reason} />
      </AuthScreen>
    </SiteShell>
  );
}
