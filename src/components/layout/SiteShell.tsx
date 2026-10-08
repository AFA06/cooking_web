import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
