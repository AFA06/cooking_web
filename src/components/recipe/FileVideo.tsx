"use client";

import * as React from "react";

interface Props {
  src: string;
  label: string;
  className?: string;
  /** Starts by itself (muted, as browsers require) and plays this many times, then stops. */
  autoPlayTimes?: number;
}

/**
 * Plays a clip. Stored clips are reached through links that stop working after a few minutes, so
 * when the player trips over one (a long pause, then play) it asks for the clip again and
 * carries on from the same moment. With `autoPlayTimes` it also starts on its own and stops after
 * that many plays; the viewer can still press play for more.
 */
export function FileVideo({ src, label, className, autoPlayTimes }: Props) {
  const [attempt, setAttempt] = React.useState(0);
  const resumeAt = React.useRef(0);
  const played = React.useRef(0);

  return (
    <video
      key={`${src}#${attempt}`}
      src={`${attempt === 0 ? src : `${src}?retry=${attempt}`}#t=0.001`}
      controls
      preload="metadata"
      playsInline
      autoPlay={!!autoPlayTimes}
      muted={!!autoPlayTimes}
      aria-label={label}
      className={className}
      onTimeUpdate={(e) => (resumeAt.current = e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        if (attempt > 0 && resumeAt.current > 0) e.currentTarget.currentTime = resumeAt.current;
      }}
      onEnded={(e) => {
        if (!autoPlayTimes || ++played.current >= autoPlayTimes) return;
        void e.currentTarget.play().catch(() => {});
      }}
      onError={() => attempt < 2 && setAttempt(attempt + 1)}
    />
  );
}
