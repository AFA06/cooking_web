"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { submitApplication, type ApplyState } from "@/app/creators/join/actions";
import { authInputClass } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { AUDIENCE_SIZES } from "@/lib/applications";

const label = "text-sm font-medium text-amber-950";
const hint = "mt-1 text-sm text-amber-600";

/** "Become a creator" request: the few things the team needs to look at someone's audience and call them. */
export function ApplicationForm({ defaultName, defaultPhone }: { defaultName: string; defaultPhone: string }) {
  const t = useT();
  const [state, action, pending] = React.useActionState<ApplyState, FormData>(submitApplication, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className={label}>{t("apply.fullName")}</label>
          <input id="fullName" name="fullName" required maxLength={80} autoComplete="name" defaultValue={v.fullName ?? defaultName} className={authInputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>{t("apply.phone")}</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={30} autoComplete="tel" defaultValue={v.phone ?? defaultPhone} placeholder="+998 90 123 45 67" className={authInputClass} />
        </div>
        <div>
          <label htmlFor="instagram" className={label}>Instagram</label>
          <input id="instagram" name="instagram" maxLength={200} spellCheck={false} autoCapitalize="none" placeholder="@username" defaultValue={v.instagram ?? ""} className={authInputClass} />
        </div>
        <div>
          <label htmlFor="telegram" className={label}>Telegram</label>
          <input id="telegram" name="telegram" maxLength={200} spellCheck={false} autoCapitalize="none" placeholder="@kanal_yoki_username" defaultValue={v.telegram ?? ""} className={authInputClass} />
        </div>
      </div>
      <p className={hint}>{t("apply.linksHint")}</p>
      <div>
        <label htmlFor="audience" className={label}>{t("apply.audience")}</label>
        <select id="audience" name="audience" required defaultValue={v.audience ?? ""} className={authInputClass}>
          <option value="" disabled>{t("apply.audiencePick")}</option>
          {AUDIENCE_SIZES.map((size) => (
            <option key={size} value={size}>{t(`apply.size.${size}`)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="about" className={label}>{t("apply.about")}</label>
        <textarea id="about" name="about" required minLength={10} maxLength={600} rows={4} defaultValue={v.about ?? ""} placeholder={t("apply.aboutPlaceholder")} className={`${authInputClass} h-auto py-3 text-base`} />
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
      <Button type="submit" size="xl" className="w-full rounded-full sm:w-auto" loading={pending}>
        <Check className="h-5 w-5" aria-hidden="true" />
        {t("apply.submit")}
      </Button>
    </form>
  );
}
