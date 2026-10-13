import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { VIDEO_PART_BYTES } from "@/lib/video";
import { getCurrentUser } from "@/server/auth";

type Context = { params: Promise<{ id: string }> };

/** MP4 and MOV files carry "ftyp" after their first four bytes, WebM starts with the EBML mark. Browsers play MOV as MP4. */
function videoMime(bytes: Buffer): string | null {
  if (bytes.length >= 12 && bytes.toString("latin1", 4, 8) === "ftyp") return "video/mp4";
  if (bytes.length >= 4 && bytes.readUInt32BE(0) === 0x1a45dfa3) return "video/webm";
  return null;
}

/** Takes one part of a clip its owner is uploading. The clip becomes playable when the last part lands. */
export async function PUT(request: Request, { params }: Context) {
  const t = await getT();
  const fail = (error: string, status: number) => Response.json({ error }, { status });
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(t("err.signInFirst"), 401);
  if (!z.string().uuid().safeParse(id).success) return fail(t("up.videoFail"), 404);

  const [upload] = await db
    .select({ size: schema.videoUploads.size })
    .from(schema.videoUploads)
    .where(and(eq(schema.videoUploads.id, id), eq(schema.videoUploads.ownerId, user.id), eq(schema.videoUploads.ready, false)))
    .limit(1);
  if (!upload) return fail(t("up.videoFail"), 404);

  const parts = Math.ceil(upload.size / VIDEO_PART_BYTES);
  const part = Number(new URL(request.url).searchParams.get("part"));
  if (!Number.isInteger(part) || part < 0 || part >= parts) return fail(t("up.videoFail"), 400);
  // Every part is full except the last, so the stored clip is exactly as long as it was announced.
  const expected = part < parts - 1 ? VIDEO_PART_BYTES : upload.size - VIDEO_PART_BYTES * (parts - 1);
  if (Number(request.headers.get("content-length") ?? expected) !== expected) return fail(t("up.videoFail"), 400);
  const data = Buffer.from(await request.arrayBuffer());
  if (data.length !== expected) return fail(t("up.videoFail"), 400);

  if (part === 0) {
    const mime = videoMime(data);
    if (!mime) {
      await db.delete(schema.videoUploads).where(eq(schema.videoUploads.id, id));
      return fail(t("err.videoType"), 415);
    }
    await db.update(schema.videoUploads).set({ mime }).where(eq(schema.videoUploads.id, id));
  }
  await db.insert(schema.videoParts).values({ uploadId: id, part, data }).onConflictDoNothing();

  if (part < parts - 1) return Response.json({ ready: false });
  const [{ n }] = await db.select({ n: count() }).from(schema.videoParts).where(eq(schema.videoParts.uploadId, id));
  if (n !== parts) return fail(t("up.videoFail"), 409);
  await db.update(schema.videoUploads).set({ ready: true }).where(eq(schema.videoUploads.id, id));
  return Response.json({ ready: true });
}

/**
 * Serves an uploaded clip. Players ask for byte ranges to seek, so the answer is streamed part by
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
