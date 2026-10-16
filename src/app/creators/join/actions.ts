"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { AUDIENCE_SIZES } from "@/lib/applications";
import { normalizePhone } from "@/lib/profile";
import { normalizeSocialUrl } from "@/lib/social";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { WINDOW, allow } from "@/server/rate-limit";
import { keyedHash } from "@/server/security";

export interface ApplyState {
  error?: string;
  /** Keeps what was typed after a failed submit. */
  values?: Record<string, string>;
}

const schemaIn = z.object({
  fullName: z.string().trim().min(2, "apply.err.name").max(80),
  phone: z.string().trim().max(30),
  instagram: z.string().trim().max(200),
  telegram: z.string().trim().max(200),
  audience: z.enum(AUDIENCE_SIZES, { message: "apply.err.audience" }),
  about: z.string().trim().min(10, "apply.err.about").max(600, "apply.err.aboutLong"),
});

/** A signed-in person asks to become a creator. Only the essentials the team needs to check them and get in touch. */
export async function submitApplication(_: ApplyState, formData: FormData): Promise<ApplyState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("order.err.signIn") };
  const values = Object.fromEntries(["fullName", "phone", "instagram", "telegram", "audience", "about"].map((k) => [k, String(formData.get(k) ?? "")]));
  if (await getCreatorForUser(user.id)) return { error: t("apply.err.already"), values };
  if (!(await allow("apply", keyedHash("user", user.id), 5, WINDOW.day))) return { error: t("auth.a.tooMany"), values };

  const parsed = schemaIn.safeParse(values);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message), values };
  const d = parsed.data;
  const phone = normalizePhone(d.phone);
  if (!phone) return { error: t("adm.login.badPhone"), values };
  const instagram = d.instagram ? normalizeSocialUrl("instagram", d.instagram) : null;
  const telegram = d.telegram ? normalizeSocialUrl("telegram", d.telegram) : null;
  if (d.instagram && !instagram) return { error: t("apply.err.instagram"), values };
  if (d.telegram && !telegram) return { error: t("apply.err.telegram"), values };
  if (!instagram && !telegram) return { error: t("apply.err.oneLink"), values };

  try {
    await db.insert(schema.creatorApplications).values({ userId: user.id, fullName: d.fullName, phone, instagram, telegram, audience: d.audience, about: d.about });
  } catch {
    // The unique index allows one open request per person.
    return { error: t("apply.err.pending") };
  }
  revalidatePath("/creators/join");
  revalidatePath("/admin", "layout");
  return {};
}
