import Image from "next/image";
import { FileVideo } from "@/components/recipe/FileVideo";
import { FILE_URL } from "@/lib/media";
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
  // A stored photo is shown to this visitor only, so it must not pass through the shared image optimiser.
  const stored = !!step.mediaUrl && FILE_URL.test(step.mediaUrl);

  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden", video ? "bg-ink" : "bg-amber-100", className)}>
      {!video && step.mediaUrl && <Image src={step.mediaUrl} alt={step.title} fill sizes={sizes} unoptimized={stored} className="object-cover" />}
      {video?.kind === "file" && <FileVideo src={video.src} poster={step.mediaUrl} label={step.title} className="h-full w-full object-contain" />}
      {video && video.kind !== "file" && <iframe src={video.embedUrl} title={step.title} loading="lazy" allowFullScreen className="h-full w-full" />}
    </div>
  );
}
