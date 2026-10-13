/**
 * Rules for the photos and clips creators upload to our file storage. The same limits are checked
 * in the browser (for a quick answer) and on the server (for real).
 */
export type MediaKind = "image" | "video";

/** How a stored file is referenced everywhere: by its id, never by a storage address. */
export const FILE_URL = /^\/api\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const fileUrl = (id: string) => `/api/files/${id}`;
export const fileIdFromUrl = (url: string): string | null => FILE_URL.exec(url.trim())?.[1].toLowerCase() ?? null;

const MB = 1024 * 1024;

export const MEDIA_RULES: Record<MediaKind, { maxBytes: number; types: readonly string[] }> = {
  image: { maxBytes: 10 * MB, types: ["image/jpeg", "image/png", "image/webp"] },
  // Phones record .mov; it is the same container family as MP4 and browsers play it as MP4.
  video: { maxBytes: 100 * MB, types: ["video/mp4", "video/quicktime", "video/webm"] },
};

export const maxMegabytes = (kind: MediaKind) => MEDIA_RULES[kind].maxBytes / MB;

export interface SniffedMedia {
  kind: MediaKind;
  /** The type the file is stored and served with. */
  contentType: string;
  extension: string;
}

/** The type a browser-declared type is stored as, or null when we do not take it. */
export function storedType(kind: MediaKind, declared: string): Pick<SniffedMedia, "contentType" | "extension"> | null {
  const type = declared.trim().toLowerCase();
  if (!MEDIA_RULES[kind].types.includes(type)) return null;
  if (type === "image/jpeg") return { contentType: type, extension: "jpg" };
  if (type === "image/png") return { contentType: type, extension: "png" };
  if (type === "image/webp") return { contentType: type, extension: "webp" };
  if (type === "video/webm") return { contentType: type, extension: "webm" };
  return { contentType: "video/mp4", extension: "mp4" };
}

/** What a file really is, read from its first bytes. A name or a declared type proves nothing. */
export function sniffMedia(bytes: Uint8Array): SniffedMedia | null {
  const text = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "image", contentType: "image/jpeg", extension: "jpg" };
  if (bytes.length >= 8 && bytes[0] === 0x89 && text(1, 4) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a)
    return { kind: "image", contentType: "image/png", extension: "png" };
  if (bytes.length >= 12 && text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return { kind: "image", contentType: "image/webp", extension: "webp" };
  if (bytes.length >= 12 && text(4, 8) === "ftyp") {
    // The same box opens HEIC and AVIF pictures; those are not videos.
    const brand = text(8, 12);
    if (/^(hei[cxms]|hev[cxms]|mif1|msf1|avi[fs])$/.test(brand)) return null;
    return { kind: "video", contentType: "video/mp4", extension: "mp4" };
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return { kind: "video", contentType: "video/webm", extension: "webm" };
  return null;
}
