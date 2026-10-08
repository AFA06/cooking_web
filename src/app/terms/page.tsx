import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <SiteShell>
      <Container size="sm" className="py-12 sm:py-16">
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Terms of Service</h1>
        <p className="mt-4 border-l-2 border-amber-600 pl-4 text-amber-800">
          This is a draft template and will be replaced with final text before launch. It is not legal advice.
        </p>
        <div className="mt-8 space-y-6 text-amber-900 leading-relaxed">
          <section>
            <h2 className="text-xl font-serif text-amber-950">1. Using {PLATFORM_CONFIG.name}</h2>
            <p className="mt-2">You may browse recipes without an account. Some features, such as saving recipes and tracking cooking, require one. You are responsible for keeping your login details secure.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">2. Recipes and content</h2>
            <p className="mt-2">Recipes are published by independent creators, who own their content. Recipes are provided for cooking guidance; follow food-safety practices and check ingredients for allergens.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">3. Premium recipes and payments</h2>
            <p className="mt-2">Some recipes are premium and require payment to unlock. Payment terms, pricing and refunds will be described here once payments are available.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">4. Creators</h2>
            <p className="mt-2">Creators are responsible for the recipes they publish and must have the right to share them. Revenue terms will be described here.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">5. Changes</h2>
            <p className="mt-2">We may update these terms. Continued use of the service means you accept the updated terms.</p>
          </section>
        </div>
      </Container>
    </SiteShell>
  );
}
