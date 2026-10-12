import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ForgotForm } from "@/components/auth/CodeForms";
import { SiteShell } from "@/components/layout/SiteShell";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { requestPasswordReset } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.forgotMeta"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getT();
  if (await getCurrentUser()) redirect("/account");
  return (
    <SiteShell>
      <AuthScreen
        eyebrow={t("auth.forgotMeta")}
        title={<>{t("auth.forgotLead")} <em className="text-clay-400">{t("auth.forgotEm")}</em></>}
        note={t("auth.forgotNote")}
      >
        <ForgotForm action={requestPasswordReset} />
        <p className="mt-6 text-sm text-amber-900">
          <Link href="/auth/login" className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </AuthScreen>
    </SiteShell>
  );
}
