import * as React from "react";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLATFORM_CONFIG } from "@/lib/constants";

const COMPARISON = [
  {
    feature: "View recipe basics",
    free: true,
    premium: true,
    freeDetail: "Title, description, cover image",
    premiumDetail: "Title, description, cover image",
  },
  {
    feature: "Ingredients list",
    free: true,
    premium: true,
    freeDetail: "Basic list with quantities",
    premiumDetail: "Exact quantities, prep notes, step grouping",
  },
  {
    feature: "Cooking steps",
    free: true,
    premium: true,
    freeDetail: "Overview only",
    premiumDetail: "Full step-by-step guided experience",
  },
  {
    feature: "Built-in timers",
    free: false,
    premium: true,
    freeDetail: "—",
    premiumDetail: "Auto-start per step, pause/resume",
  },
  {
    feature: "Temperature guides",
    free: false,
    premium: true,
    freeDetail: "—",
    premiumDetail: "Exact temps for each step",
  },
  {
    feature: "Creator tips & tricks",
    free: false,
    premium: true,
    freeDetail: "—",
    premiumDetail: "Pro tips, common mistakes, variations",
  },
  {
    feature: "Step media (photos/video)",
    free: false,
    premium: true,
    freeDetail: "Cover only",
    premiumDetail: "Per-step photos & video clips",
  },
  {
    feature: "Save to cookbook",
    free: true,
    premium: true,
    freeDetail: "Requires free account",
    premiumDetail: "Requires free account",
  },
  {
    feature: "Cooking history",
    free: true,
    premium: true,
    freeDetail: "Basic log",
    premiumDetail: "Detailed history with notes",
  },
];

export function FreeVsPremium() {
  return (
    <section className="py-20 lg:py-28 bg-amber-50" aria-labelledby="pricing-heading">
      <Container size="lg">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
            Free vs Premium
          </h2>
          <p className="mt-4 text-amber-700 text-lg">
            Free recipes give you the basics. Premium unlocks the full guided
            experience creators designed.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="border-b-2 border-amber-200">
                <th className="pb-3 font-medium text-amber-950">Feature</th>
                <th className="pb-3 font-medium text-amber-950 text-center w-40">
                  Free
                </th>
                <th className="pb-3 font-medium text-amber-950 text-center w-48">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-amber-100 ${
                    i % 2 === 1 ? "bg-amber-50/50" : ""
                  }`}
                >
                  <td className="py-4 font-medium text-amber-950">
                    {row.feature}
                  </td>
                  <td className="py-4 text-center">
                    {row.free ? (
                      <span className="inline-flex items-center justify-center gap-1.5 text-emerald-700 font-medium">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="hidden sm:inline">Included</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 text-amber-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="hidden sm:inline">Not included</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-center">
                    {row.premium ? (
                      <span className="inline-flex items-center justify-center gap-1.5 text-amber-700 font-medium">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="hidden sm:inline">Included</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 text-amber-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="hidden sm:inline">Not included</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-950">Free recipes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-amber-700">
                Perfect for getting started. See the recipe overview, ingredients,
                and basic steps. Create a free account to save recipes and track
                your cooking.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href={PLATFORM_CONFIG.urls.recipes}>Browse free recipes</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-600 bg-amber-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">Premium recipes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-amber-200">
                The full experience creators built. Step-by-step guidance,
                timers, temperatures, tips, and per-step media. Prices set by
                creators (typically 10,000–20,000 UZS).
              </p>
              <Button variant="secondary" className="w-full" asChild>
                <a href={PLATFORM_CONFIG.urls.recipes}>Explore premium</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}