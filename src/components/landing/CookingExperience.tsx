"use client";

import * as React from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { PLATFORM_CONFIG } from "@/lib/constants";

const COOKING_STEPS = [
  {
    step: 4,
    total: 10,
    title: "Fry the onions",
    instruction:
      "Heat oil in a large kazan over medium heat. Add sliced onions and fry until golden brown, stirring occasionally, about 7 minutes.",
    timer: 7 * 60,
    temperature: 180,
    media: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80",
    tip: "Don&rsquo;t rush this step &mdash; golden onions are the flavor base of good plov.",
    ingredients: ["2 large onions", "100ml vegetable oil"],
  },
  {
    step: 5,
    total: 10,
    title: "Add meat and brown",
    instruction:
      "Add cubed lamb to the onions. Increase heat to high and brown the meat on all sides, about 5 minutes. Do not overcrowd the pan.",
    timer: 5 * 60,
    temperature: 200,
    media: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    tip: "Pat the meat dry before adding &mdash; moisture prevents browning.",
    ingredients: ["500g lamb shoulder", "1 tsp salt"],
  },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function CookingExperience() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(COOKING_STEPS[0].timer);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const step = COOKING_STEPS[currentStep];

  React.useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimerRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timeLeft]);

  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    setTimerRunning(false);
    setTimeLeft(COOKING_STEPS[newStep].timer);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="cooking-heading">
      <Container size="md">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h2 id="cooking-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
            This is why Damda exists
          </h2>
          <p className="mt-4 text-amber-700 text-lg">
            A calm digital cooking assistant standing beside you. One step at a
            time. No searching, no guessing.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-amber-100">
                <Image
                  src={step.media}
                  alt={step.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs opacity-90 mt-1">
                    Step {step.step} of {step.total}
                  </p>
                </div>
              </div>
              <CardContent className="pt-4 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-amber-600 font-medium">
                    Step {step.step} / {step.total}
                  </span>
                  {step.temperature && (
                    <span className="text-sm text-amber-600 flex items-center gap-1">
                      🌡️ {step.temperature}°C
                    </span>
                  )}
                </div>
                <p className="text-lg text-amber-950 leading-relaxed mb-6">
                  {step.instruction}
                </p>

                {step.timer > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-amber-950">Timer</span>
                      <Button
                        variant={timerRunning ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => setTimerRunning(!timerRunning)}
                        className="gap-1.5"
                      >
                        {timerRunning ? "Pause" : "Start"}
                      </Button>
                    </div>
                    <div className="text-4xl font-mono font-bold text-amber-950 text-center font-tabular-nums">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="h-1.5 bg-amber-100 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 transition-all duration-1000"
                        style={{
                          width: `${((step.timer - timeLeft) / step.timer) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {step.tip && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                    <span className="text-lg flex-shrink-0">💡</span>
                    <div>
                      <p className="font-medium text-amber-950 text-sm">Creator tip</p>
                      <p className="text-sm text-amber-700 mt-0.5">{step.tip}</p>
                    </div>
                  </div>
                )}

                {step.ingredients.length > 0 && (
                  <div className="mt-6">
                    <p className="font-medium text-amber-950 text-sm mb-3">
                      Ingredients for this step
                    </p>
                    <ul className="space-y-2">
                      {step.ingredients.map((ing, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-amber-700"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            aria-label={ing}
                          />
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={currentStep === 0}
                onClick={() => handleStepChange(currentStep - 1)}
              >
                Previous
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  handleStepChange(Math.min(currentStep + 1, COOKING_STEPS.length - 1))
                }
              >
                {currentStep === COOKING_STEPS.length - 1 ? "Finish" : "Next step"}
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-amber-950 mb-4">All steps</h3>
                <div className="space-y-3">
                  {COOKING_STEPS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleStepChange(i)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        i === currentStep
                          ? "bg-amber-50 border-2 border-amber-600"
                          : "bg-amber-50/50 hover:bg-amber-50 border border-amber-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-950">
                          Step {s.step}: {s.title}
                        </span>
                        {s.timer > 0 && (
                          <span className="text-xs text-amber-600 font-mono">
                            {formatTime(s.timer)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-600 mt-1 line-clamp-1">
                        {s.instruction}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="text-center">
          <p className="text-amber-700 mb-4">
            This is a live demo. In the real product, steps sync with the
            creator&rsquo;s recipe structure.
          </p>
          <Button variant="outline" asChild>
            <a href={PLATFORM_CONFIG.urls.recipes}>Try cooking a real recipe</a>
          </Button>
        </div>
      </Container>
    </section>
  );
}