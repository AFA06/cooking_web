import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { VIDEO_PART_BYTES } from "@/lib/video";

type Context = { params: Promise<{ id: string }> };

/**
 * Serves a clip uploaded before file storage existed (new clips are files, see /api/files). Players ask for byte ranges to seek, so the answer is streamed part by
 * part from wherever they want to start. Each upload has its own id, so it can be cached for good.
 */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response(null, { status: 404 });

  const [video] = await db
    .select({ mime: schema.videoUploads.mime, size: schema.videoUploads.size })
    .from(schema.videoUploads)
    .where(and(eq(schema.videoUploads.id, id), eq(schema.videoUploads.ready, true)))
    .limit(1);
  if (!video) return new Response(null, { status: 404 });

  let start = 0;
  let end = video.size - 1;
  const range = request.headers.get("range");
  const asked = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (asked && (asked[1] || asked[2])) {
    if (asked[1]) {
      start = Number(asked[1]);
      if (asked[2]) end = Math.min(Number(asked[2]), end);
    } else {
      start = Math.max(0, video.size - Number(asked[2]));
    }
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${video.size}` } });
  }
  const partial = !!asked && (asked[1] !== "" || asked[2] !== "");

  let position = start;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (position > end) return controller.close();
      const part = Math.floor(position / VIDEO_PART_BYTES);
      const [row] = await db
        .select({ data: schema.videoParts.data })
        .from(schema.videoParts)
        .where(and(eq(schema.videoParts.uploadId, id), eq(schema.videoParts.part, part)))
        .limit(1);
      if (!row) return controller.error(new Error("missing video part"));
      const offset = part * VIDEO_PART_BYTES;
      const slice = row.data.subarray(position - offset, Math.min(row.data.length, end - offset + 1));
      position += slice.length;
      controller.enqueue(new Uint8Array(slice));
    },
  });

  return new Response(body, {
    status: partial ? 206 : 200,
    headers: {
      "Content-Type": video.mime,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      ...(partial ? { "Content-Range": `bytes ${start}-${end}/${video.size}` } : {}),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
