import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { CreatorFields } from "@/components/admin/CreatorFields";
import { PageHeader, Panel } from "@/components/admin/ui";
import { getT } from "@/i18n/server";
import { requireAdminPage } from "@/server/admin";
import { createCreator } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.newCreator") };
}

export default async function NewCreatorPage() {
  const [, t] = await Promise.all([requireAdminPage(), getT()]);
  return (
    <>
      <PageHeader
        back={{ href: "/admin/creators", label: t("adm.nav.creators") }}
        title={t("adm.newCreator")}
        description={t("adm.newCreatorDesc")}
      />
      <Panel className="max-w-3xl">
        <ActionForm action={createCreator} submitLabel={t("adm.createCreator")}>
          <CreatorFields slugOptional />
        </ActionForm>
      </Panel>
    </>
  );
}
