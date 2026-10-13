import Image from "next/image";
import { parseVideoUrl } from "@/lib/video";
import { cn } from "@/lib/utils";
import type { RecipeStep } from "@/types/recipe";

interface Props {
  step: RecipeStep;
  /** Passed to the photo, see next/image. */
  sizes: string;
  className?: string;
}

/** What a step shows: its clip when it has one (the photo waits in front as the poster), otherwise its photo. */
export function StepMedia({ step, sizes, className }: Props) {
  const video = step.videoUrl ? parseVideoUrl(step.videoUrl) : null;
  if (!video && !step.mediaUrl) return null;

  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden", video ? "bg-ink" : "bg-amber-100", className)}>
      {!video && step.mediaUrl && <Image src={step.mediaUrl} alt={step.title} fill sizes={sizes} className="object-cover" />}
      {video?.kind === "file" && (
        <video key={video.src} src={video.src} poster={step.mediaUrl} controls preload="metadata" playsInline aria-label={step.title} className="h-full w-full object-contain" />
      )}
      {video && video.kind !== "file" && <iframe src={video.embedUrl} title={step.title} loading="lazy" allowFullScreen className="h-full w-full" />}
    </div>
  );
}
