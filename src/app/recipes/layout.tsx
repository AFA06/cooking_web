import { SiteShell } from "@/components/layout/SiteShell";

export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
