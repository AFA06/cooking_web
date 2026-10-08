import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { CreatorFields } from "@/components/admin/CreatorFields";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/admin";
import { createCreator } from "../../actions";

export const metadata: Metadata = { title: "Yangi ijodkor" };

export default async function NewCreatorPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeader
        back={{ href: "/admin/creators", label: "Ijodkorlar" }}
        title="Yangi ijodkor"
        description="Profil foydalanuvchi hisobiga ulanmagan holda yaratiladi. Retseptlarni admin sifatida siz qo‘shasiz."
      />
      <Panel className="max-w-3xl">
        <ActionForm action={createCreator} submitLabel="Ijodkorni yaratish">
          <CreatorFields slugOptional />
        </ActionForm>
      </Panel>
    </>
  );
}
