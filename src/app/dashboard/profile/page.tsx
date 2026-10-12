import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CreatorProfileEditor } from "@/components/dashboard/CreatorProfileEditor";
import { getT } from "@/i18n/server";
import { cleanSocialLinks } from "@/lib/social";
import { getCurrentCreator } from "@/server/creator";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("dash.profileTitle"), robots: { index: false } };
}

export default async function CreatorProfilePage() {
  const [ctx, t] = await Promise.all([getCurrentCreator(), getT()]);
  if (!ctx) redirect("/creators/join");
  const { creator } = ctx;

  return (
    <Container size="sm" className="py-12">
      <Link href="/dashboard" className="text-sm text-amber-600 hover:text-amber-950">← {t("nav.creatorPanel")}</Link>
      <h1 className="mt-3 text-4xl font-medium text-amber-950 sm:text-5xl">{t("dash.profileTitle")}</h1>
      <p className="mt-3 text-amber-900">
        {t("dash.publicPage")}{" "}
        <Link href={`/creators/${creator.slug}`} className="font-medium text-amber-600 underline underline-offset-4">/creators/{creator.slug}</Link>
      </p>
      <div className="mt-10">
        <CreatorProfileEditor
          initial={{ name: creator.name, bio: creator.bio ?? "", avatarUrl: creator.avatarUrl ?? "", socialLinks: cleanSocialLinks(creator.socialLinks) }}
        />
      </div>
    </Container>
  );
}
