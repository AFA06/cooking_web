import type { Metadata } from "next";
import { CreatorFields } from "@/components/admin/CreatorFields";
import { NewBloggerForm } from "@/components/admin/NewBloggerForm";
import { Field, PageHeader, Panel, TextInput } from "@/components/admin/ui";
import { getT } from "@/i18n/server";
import { requireAdminPage } from "@/server/admin";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.newCreator") };
}

export default async function NewCreatorPage() {
  const [, t] = await Promise.all([requireAdminPage(), getT()]);
  return (
    <>
      <PageHeader back={{ href: "/admin/creators", label: t("adm.nav.creators") }} title={t("adm.newCreator")} description={t("adm.blogger.desc")} />
      <Panel className="max-w-3xl">
        <NewBloggerForm>
          <Field label={t("adm.blogger.phone")} htmlFor="phone" hint={t("adm.login.phoneHint")}>
            <TextInput id="phone" name="phone" type="tel" inputMode="tel" required placeholder="+998 90 123 45 67" />
          </Field>
          <CreatorFields slugOptional />
        </NewBloggerForm>
      </Panel>
    </>
  );
}
