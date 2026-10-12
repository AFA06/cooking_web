"use server";

import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";

/** The browser shrinks a photo to about this much base64 before sending it. */
const MAX_BASE64_LENGTH = 1_100_000;
const MAX_UPLOADS_PER_PERSON = 400;

/**
 * Stores a photo a creator picked. The browser has already resized it to a JPEG; here the bytes are
 * checked again (type signature and size) so nothing but a small JPEG is ever stored or served.
 */
export async function uploadImage(base64: string): Promise<{ url: string } | { error: string }> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("err.signInFirst") };
  const isCreator = user.role === "admin" || !!(await getCreatorForUser(user.id));
  if (!isCreator) return { error: t("err.needCreator") };

  if (typeof base64 !== "string" || base64.length > MAX_BASE64_LENGTH || !/^[A-Za-z0-9+/]+=*$/.test(base64)) return { error: t("err.photoBig") };
  const bytes = Buffer.from(base64, "base64");
  const isJpeg = bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  if (!isJpeg) return { error: t("err.photoType") };

  const [{ n }] = await db.select({ n: count() }).from(schema.mediaUploads).where(eq(schema.mediaUploads.ownerId, user.id));
  if (n >= MAX_UPLOADS_PER_PERSON) return { error: t("err.uploadLimit") };

  const [row] = await db.insert(schema.mediaUploads).values({ ownerId: user.id, mime: "image/jpeg", data: base64 }).returning({ id: schema.mediaUploads.id });
  return { url: `/api/media/${row.id}` };
}
