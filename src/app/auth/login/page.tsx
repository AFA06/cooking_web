import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthTabs, authReason } from "@/components/auth/AuthTabs";
import { SiteShell } from "@/components/layout/SiteShell";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { login } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.login"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const [{ next = "", reset }, t] = await Promise.all([searchParams, getT()]);
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (await getCurrentUser()) redirect(safe || "/account");
  const reason = await authReason(safe);

  return (
    <SiteShell>
      <AuthScreen eyebrow={t("nav.login")} title={<>{t("auth.loginLead")} <em className="text-clay-400">{t("auth.loginEm")}</em></>} note={t("auth.loginNote")}>
        <AuthTabs active="login" next={safe} />
        <AuthForm mode="login" action={login} next={safe} notice={reset === "1" ? t("auth.resetDone") : reason} />
      </AuthScreen>
    </SiteShell>
  );
}
