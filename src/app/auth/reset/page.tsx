import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ResendButton, ResetPasswordForm } from "@/components/auth/CodeForms";
import { SiteShell } from "@/components/layout/SiteShell";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { completePasswordReset, resendPasswordResetCode } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.resetMeta"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deliberately never looks the reset up: this screen is identical whether or not the account exists,
 * so it cannot be used to find out who has one.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [{ c = "" }, t] = await Promise.all([searchParams, getT()]);
  if (await getCurrentUser()) redirect("/account");
  if (!UUID.test(c)) redirect("/auth/forgot");

  return (
    <SiteShell>
      <AuthScreen
        eyebrow={t("auth.forgotMeta")}
        title={<>{t("auth.resetLead")} <em className="text-clay-400">{t("auth.resetEm")}</em></>}
        note={t("auth.resetNote")}
      >
        <ResetPasswordForm action={completePasswordReset} challengeId={c} />
        <div className="mt-6 flex flex-col gap-4">
          <ResendButton action={resendPasswordResetCode} challengeId={c} label={t("auth.resendCode")} />
          <ResendButton action={resendPasswordResetCode} challengeId={c} via="sms" label={t("auth.smsInstead")} />
          <Link href="/auth/forgot" className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            {t("auth.otherIdentifier")}
          </Link>
        </div>
      </AuthScreen>
    </SiteShell>
  );
}
