import * as React from "react";
import { Container } from "@/components/ui/Container";
import { Separator } from "@/components/ui/Separator";

const TRADITIONAL_STEPS = [
  { icon: "📱", label: "Watch video", desc: "15 min recipe video" },
  { icon: "🚶", label: "Go to kitchen", desc: "Start cooking" },
  { icon: "😰", label: "Forget step", desc: "Was it 2 or 3 tbsp?" },
  { icon: "📲", label: "Touch phone", desc: "Wet, oily hands" },
  { icon: "🔍", label: "Search video", desc: "Find timestamp" },
  { icon: "▶️", label: "Watch again", desc: "Rewind, replay" },
  { icon: "🔁", label: "Repeat", desc: "Every few minutes" },
];

const GUIDED_STEPS = [
  { icon: "📖", label: "Open recipe", desc: "All info at a glance" },
  { icon: "✅", label: "Follow step", desc: "Clear instruction" },
  { icon: "⏱️", label: "Timer starts", desc: "Auto for each step" },
  { icon: "➡️", label: "Next step", desc: "One tap, hands-free" },
  { icon: "🎉", label: "Done", desc: "Enjoy your meal" },
];

function StepCard({ icon, label, desc, isLast }: { icon: string; label: string; desc: string; isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center relative">
      <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-amber-950 text-sm">{label}</h3>
      <p className="text-xs text-amber-600/70 mt-0.5">{desc}</p>
      {!isLast && (
        <div className="absolute top-7 left-[calc(50%+7px)] w-1 h-[calc(100%+1.5rem)] bg-amber-100" aria-hidden="true" />
      )}
    </div>
  );
}

export function ProblemSolution() {
  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="problem-heading">
      <Container size="lg">
        <header className="text-center max-w-2xl mx-auto mb-16">
          <h2 id="problem-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
            The problem with learning from videos
          </h2>
          <p className="mt-4 text-amber-700 text-lg">
            Traditional recipe videos aren&rsquo;t designed for the kitchen. Our guided
            experience is.
          </p>
        </header>

        <div className="space-y-16">
          <div>
            <h3 className="text-lg font-semibold text-amber-950 text-center mb-8">
              Traditional workflow
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-4">
              {TRADITIONAL_STEPS.map((step, i) => (
                <StepCard key={i} {...step} isLast={i === TRADITIONAL_STEPS.length - 1} />
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="text-lg font-semibold text-emerald-800 text-center mb-8">
              Guided cooking experience
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-4">
              {GUIDED_STEPS.map((step, i) => (
                <StepCard key={i} {...step} isLast={i === GUIDED_STEPS.length - 1} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}