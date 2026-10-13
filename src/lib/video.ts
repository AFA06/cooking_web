import { FILE_URL } from "@/lib/media";

/**
 * A video is either a clip uploaded to us or a link: YouTube, Vimeo, or a direct .mp4/.webm file over https.
 * Only these hosts are ever embedded, so a creator cannot put an arbitrary page in an iframe.
 */
export type VideoSource = { kind: "youtube" | "vimeo"; embedUrl: string } | { kind: "file"; src: string };

const YOUTUBE_ID = /^[\w-]{11}$/;

/** Clips uploaded before file storage existed are still served from here, in pieces of this size. New ones are files, see lib/media. */
export const UPLOADED_VIDEO = /^\/api\/video\/[0-9a-f-]{36}$/i;
export const VIDEO_PART_BYTES = 1024 * 1024;

export function parseVideoUrl(input: string): VideoSource | null {
  if (FILE_URL.test(input.trim()) || UPLOADED_VIDEO.test(input.trim())) return { kind: "file", src: input.trim() };
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID.test(id) ? { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "youtube.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = url.searchParams.get("v") ?? (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null);
    return id && YOUTUBE_ID.test(id) ? { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    return id ? { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` } : null;
  }
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return { kind: "file", src: url.toString() };
  return null;
}
