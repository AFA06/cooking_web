import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { listCreators } from "@/server/recipes";

export const metadata: Metadata = {
  title: "Creators",
  description: "Food creators publishing step-by-step recipes on Damda.",
  alternates: { canonical: "/creators" },
};

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  const creators = await listCreators();
  return (
    <Container size="lg" className="py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Creators</h1>
        <p className="mt-4 text-lg text-amber-800">The food creators behind the recipes. These are sample profiles.</p>
      </header>
      <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {creators.map((c) => (
          <li key={c.id} className="border-t border-amber-200 pt-6">
            <Link href={`/creators/${c.slug}`} className="group flex items-center gap-4">
              {c.avatarUrl && (
                <Image src={c.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-xl text-amber-950 group-hover:text-amber-700 break-words">{c.name}</h2>
                <p className="text-sm text-amber-700">{c.recipeCount} recipes</p>
              </div>
            </Link>
            {c.isFoundingCreator && <Badge variant="founding" className="mt-4">Founding creator</Badge>}
            {c.bio && <p className="mt-3 text-amber-800 text-sm">{c.bio}</p>}
          </li>
        ))}
      </ul>
    </Container>
  );
}
