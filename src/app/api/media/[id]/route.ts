import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

/** Serves a creator's uploaded photo. Each upload has its own id, so responses can be cached for good. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response(null, { status: 404 });

  const [photo] = await db.select({ mime: schema.mediaUploads.mime, data: schema.mediaUploads.data }).from(schema.mediaUploads).where(eq(schema.mediaUploads.id, id)).limit(1);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(Buffer.from(photo.data, "base64"), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
