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

/**
 * What a step shows: its photo and its clip, each as itself, one under the other. The photo is
 * never used as the clip's cover; a step may have either or both.
 */
export function StepMedia({ step, sizes, className }: Props) {
  const video = step.videoUrl ? parseVideoUrl(step.videoUrl) : null;
  if (!video && !step.mediaUrl) return null;
  // A stored photo is shown to this visitor only, so it must not pass through the shared image optimiser.
  const stored = !!step.mediaUrl && FILE_URL.test(step.mediaUrl);
  const frame = "relative aspect-[16/9] overflow-hidden rounded-[inherit]";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {step.mediaUrl && (
        <div className={cn(frame, "bg-amber-100")}>
          <Image src={step.mediaUrl} alt={step.title} fill sizes={sizes} unoptimized={stored} className="object-cover" />
        </div>
      )}
      {video && (
        <div className={cn(frame, "bg-ink")}>
          {video.kind === "file" ? (
            <FileVideo src={video.src} label={step.title} className="h-full w-full object-contain" />
          ) : (
            <iframe src={video.embedUrl} title={step.title} loading="lazy" allowFullScreen className="h-full w-full" />
          )}
        </div>
      )}
    </div>
  );
}
