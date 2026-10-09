import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

/** Serves a review photo. Each upload gets a new id, so responses can be cached for good. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response(null, { status: 404 });

  const [photo] = await db.select({ mime: schema.reviewPhotos.mime, data: schema.reviewPhotos.data }).from(schema.reviewPhotos).where(eq(schema.reviewPhotos.id, id)).limit(1);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(Buffer.from(photo.data, "base64"), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
