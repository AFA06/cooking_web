"use client";

import * as React from "react";

interface Props {
  src: string;
  poster?: string;
  label: string;
  className?: string;
}

/**
 * Plays a clip. Stored clips are reached through links that stop working after a few minutes, so
 * when the player trips over one (a long pause, then play) it asks for the clip again and
 * carries on from the same moment.
 */
export function FileVideo({ src, poster, label, className }: Props) {
  const [attempt, setAttempt] = React.useState(0);
  const resumeAt = React.useRef(0);

  return (
    <video
      key={`${src}#${attempt}`}
      src={attempt === 0 ? src : `${src}?retry=${attempt}`}
      poster={poster || undefined}
      controls
      preload="metadata"
      playsInline
      aria-label={label}
      className={className}
      onTimeUpdate={(e) => (resumeAt.current = e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        if (attempt > 0 && resumeAt.current > 0) e.currentTarget.currentTime = resumeAt.current;
      }}
      onError={() => attempt < 2 && setAttempt(attempt + 1)}
    />
  );
}
