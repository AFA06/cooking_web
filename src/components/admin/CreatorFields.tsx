import { CheckboxField, Field, TextArea, TextInput } from "@/components/admin/ui";

interface Values {
  name?: string;
  slug?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isFoundingCreator?: boolean;
  isFeatured?: boolean;
}

export function CreatorFields({ values = {}, slugOptional = false }: { values?: Values; slugOptional?: boolean }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ko‘rinadigan ism" htmlFor="name">
          <TextInput id="name" name="name" required maxLength={80} defaultValue={values.name ?? ""} />
        </Field>
        <Field
          label="Sahifa manzili"
          htmlFor="slug"
          hint={slugOptional ? "Bo‘sh qoldirilsa, ismdan yaratiladi. /creators/manzil" : "Ommaviy havola: /creators/manzil. O‘zgartirilsa, eski havolalar ishlamaydi."}
        >
          <TextInput id="slug" name="slug" maxLength={60} pattern="[a-z0-9-]*" required={!slugOptional} defaultValue={values.slug ?? ""} />
        </Field>
      </div>
      <Field label="Tanishtiruv" htmlFor="bio">
        <TextArea id="bio" name="bio" rows={3} maxLength={500} defaultValue={values.bio ?? ""} />
      </Field>
      <Field label="Profil rasmi havolasi" htmlFor="avatarUrl" hint="https:// bilan boshlanadigan rasm havolasi. Ixtiyoriy.">
        <TextInput id="avatarUrl" name="avatarUrl" type="url" maxLength={1000} defaultValue={values.avatarUrl ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField name="isFoundingCreator" label="Asoschi ijodkor" hint="Asoschilik davrida komissiyasiz" defaultChecked={values.isFoundingCreator} />
        <CheckboxField name="isFeatured" label="Tavsiya etilgan" hint="Tanlangan ijodkorlar qatorida ko‘rsatiladi" defaultChecked={values.isFeatured} />
      </div>
    </>
  );
}
