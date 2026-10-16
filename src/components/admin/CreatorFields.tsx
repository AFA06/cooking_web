import { getT } from "@/i18n/server";
import { CheckboxField, Field, TextArea, TextInput } from "@/components/admin/ui";

interface Values {
  name?: string;
  slug?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  telegramUsername?: string | null;
  isFoundingCreator?: boolean;
  isFeatured?: boolean;
}

export async function CreatorFields({ values = {}, slugOptional = false }: { values?: Values; slugOptional?: boolean }) {
  const t = await getT();
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("profile.displayName")} htmlFor="name">
          <TextInput id="name" name="name" required maxLength={80} defaultValue={values.name ?? ""} />
        </Field>
        <Field
          label={t("adm.f.slug")}
          htmlFor="slug"
          hint={slugOptional ? t("adm.f.slugOptional") : t("adm.f.slugHint")}
        >
          <TextInput id="slug" name="slug" maxLength={60} pattern="[a-z0-9-]*" required={!slugOptional} defaultValue={values.slug ?? ""} />
        </Field>
      </div>
      <Field label={t("profile.intro")} htmlFor="bio">
        <TextArea id="bio" name="bio" rows={3} maxLength={500} defaultValue={values.bio ?? ""} />
      </Field>
      <Field label={t("profile.avatarUrl")} htmlFor="avatarUrl" hint={t("adm.f.avatarHint")}>
        <TextInput id="avatarUrl" name="avatarUrl" type="url" maxLength={1000} defaultValue={values.avatarUrl ?? ""} />
      </Field>
      <Field label={t("adm.f.telegram")} htmlFor="telegramUsername" hint={t("adm.f.telegramHint")}>
        <TextInput id="telegramUsername" name="telegramUsername" maxLength={60} placeholder="@username" autoComplete="off" spellCheck={false} defaultValue={values.telegramUsername ? `@${values.telegramUsername}` : ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField name="isFoundingCreator" label={t("creator.foundingCreator")} hint={t("adm.f.foundingHint")} defaultChecked={values.isFoundingCreator} />
        <CheckboxField name="isFeatured" label={t("adm.f.featured")} hint={t("adm.f.featuredHint")} defaultChecked={values.isFeatured} />
      </div>
    </>
  );
}
