import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CreatorProfileEditor } from "@/components/dashboard/CreatorProfileEditor";
import { cleanSocialLinks } from "@/lib/social";
import { getCurrentCreator } from "@/server/creator";

export const metadata: Metadata = { title: "Profilni tahrirlash", robots: { index: false } };

export default async function CreatorProfilePage() {
  const ctx = await getCurrentCreator();
  if (!ctx) redirect("/creators/join");
  const { creator } = ctx;

  return (
    <Container size="sm" className="py-12">
      <Link href="/dashboard" className="text-sm text-amber-600 hover:text-amber-950">← Ijodkor paneli</Link>
      <h1 className="mt-3 text-4xl font-medium text-amber-950 sm:text-5xl">Profilni tahrirlash</h1>
      <p className="mt-3 text-amber-900">
        Ommaviy sahifangiz:{" "}
        <Link href={`/creators/${creator.slug}`} className="font-medium text-amber-700 underline underline-offset-4">/creators/{creator.slug}</Link>
      </p>
      <div className="mt-10">
        <CreatorProfileEditor
          initial={{ name: creator.name, bio: creator.bio ?? "", avatarUrl: creator.avatarUrl ?? "", socialLinks: cleanSocialLinks(creator.socialLinks) }}
        />
      </div>
    </Container>
  );
}
