import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";

/** Shown the moment a link is clicked, while the next page is prepared on the server. */
export default function Loading() {
  return (
    <SiteShell>
      <Container size="xl" className="py-12" aria-busy="true">
        <div className="h-4 w-40 animate-pulse rounded-full bg-amber-200/70" />
        <div className="mt-5 h-12 w-full max-w-xl animate-pulse rounded-2xl bg-amber-200/70" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[1.25rem] bg-amber-100" />
          ))}
        </div>
      </Container>
    </SiteShell>
  );
}
