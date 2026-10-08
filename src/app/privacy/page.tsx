import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <SiteShell>
      <Container size="sm" className="py-12 sm:py-16">
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Privacy Policy</h1>
        <p className="mt-4 border-l-2 border-amber-600 pl-4 text-amber-800">
          This is a draft template and will be replaced with final text before launch. It is not legal advice.
        </p>
        <div className="mt-8 space-y-6 text-amber-900 leading-relaxed">
          <section>
            <h2 className="text-xl font-serif text-amber-950">What we collect</h2>
            <p className="mt-2">When you create an account we store your name, email address and a hashed password. We also store the recipes you save and your cooking history.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">How we use it</h2>
            <p className="mt-2">We use this information to run your account, show your saved recipes and history, and improve {PLATFORM_CONFIG.name}. We do not sell your personal data.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">Cookies</h2>
            <p className="mt-2">We use a single session cookie to keep you logged in.</p>
          </section>
          <section>
            <h2 className="text-xl font-serif text-amber-950">Your choices</h2>
            <p className="mt-2">Contact details for access and deletion requests will be added here before launch.</p>
          </section>
        </div>
      </Container>
    </SiteShell>
  );
}
