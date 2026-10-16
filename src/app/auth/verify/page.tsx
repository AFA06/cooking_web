import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ResendButton, VerifyCodeForm } from "@/components/auth/CodeForms";
import { SiteShell } from "@/components/layout/SiteShell";
import { maskEmail, maskPhone } from "@/lib/auth-rules";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { cooldownLeft, getOpenChallenge } from "@/server/challenges";
import { resendSignupCode, verifySignup } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.verifyMeta"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string; next?: string }> }) {
  const [{ c = "", next = "" }, t] = await Promise.all([searchParams, getT()]);
  if (await getCurrentUser()) redirect("/account");
  const safe = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "";
  const challenge = await getOpenChallenge(c, "signup");

  return (
    <SiteShell>
      <AuthScreen
        eyebrow={t("auth.verifyEyebrow")}
        title={<>{t("auth.verifyLead")} <em className="text-clay-400">{t("auth.verifyEm")}</em></>}
        note={
          !challenge?.destination
            ? t("auth.codeExpired")
            : challenge.channel === "email"
              ? t("auth.codeSentToEmail", { email: maskEmail(challenge.destination) })
              : t("auth.codeSentTo", { phone: maskPhone(challenge.destination) })
        }
      >
        {challenge ? (
          <>
            <VerifyCodeForm action={verifySignup} challengeId={challenge.id} next={safe} />
            <div className="mt-6 flex flex-col gap-3">
              <ResendButton action={resendSignupCode} challengeId={challenge.id} label={t("auth.resendCode")} secondsLeft={cooldownLeft(challenge)} />
              <Link href="/auth/signup" className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
                {challenge.channel === "email" ? t("auth.changeDetails") : t("auth.changeNumber")}
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-8 text-amber-900">
            <Link href="/auth/signup" className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
              {t("auth.restartSignup")}
            </Link>
          </p>
        )}
      </AuthScreen>
    </SiteShell>
  );
}
