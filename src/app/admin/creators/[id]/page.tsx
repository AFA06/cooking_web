import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CreatorFields } from "@/components/admin/CreatorFields";
import { RecipeTable } from "@/components/admin/RecipeTable";
import { Avatar, EmptyState, PageHeader, Panel, StatTile } from "@/components/admin/ui";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatShortDate } from "@/lib/format";
import { getCreatorAdmin, listRecipesAdmin, requireAdminPage } from "@/server/admin";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { deleteCreator, issueCreatorLogin, updateCreator } from "../../actions";
import { TextInput, Field } from "@/components/admin/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("role.creator") };
}

export default async function AdminCreatorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ approved?: string }> }) {
  const [, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const creator = await getCreatorAdmin(id);
  if (!creator) notFound();
  const { items: recipes } = await listRecipesAdmin({ creatorId: id });
  const [extra] = await db
    .select({ telegramUsername: schema.creators.telegramUsername, blockedAt: schema.users.blockedAt })
    .from(schema.creators)
    .leftJoin(schema.users, eq(schema.users.id, schema.creators.userId))
    .where(eq(schema.creators.id, id))
    .limit(1);
  const { approved } = await searchParams;
  const completion = creator.cooks > 0 ? Math.round((creator.completions / creator.cooks) * 100) : 0;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/creators", label: t("adm.nav.creators") }}
        title={creator.name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Avatar name={creator.name} src={creator.avatarUrl} size={28} />
            <span>{t("adm.since", { date: formatShortDate(creator.createdAt, locale) })}</span>
            {creator.userId ? (
              <Link href={`/admin/users/${creator.userId}`} className="text-amber-700 hover:underline">{creator.userEmail ?? t("adm.manageAccount")}</Link>
            ) : (
              <span>{t("adm.notLinked")}</span>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/creators/${creator.slug}`}><ExternalLink className="h-4 w-4" aria-hidden="true" />{t("adm.publicPage")}</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/recipes/new?creatorId=${creator.id}`}><Plus className="h-4 w-4" aria-hidden="true" />{t("adm.addRecipe")}</Link>
            </Button>
          </>
        }
      />

      {approved === "1" && <p role="status" className="mb-6 rounded-lg bg-sage-100 px-5 py-4 font-medium text-sage-900">{t("apply.adm.approvedOk")}</p>}
      {extra?.blockedAt && creator.userId && (
        <p role="alert" className="mb-6 rounded-lg bg-clay-100 px-5 py-4 text-amber-950">
          {t("adm.creatorBlocked")} <Link href={`/admin/users/${creator.userId}`} className="font-semibold underline">{t("adm.manageAccount")}</Link>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("nav.recipes")} value={`${creator.published}`} suffix={`/ ${creator.recipes}`} hint={t("adm.publishedTotal")} />
        <StatTile label={t("dash.col.views")} value={formatNumber(creator.views)} hint={t("adm.allTimeShort")} />
        <StatTile label={t("dash.col.saves")} value={formatNumber(creator.saves)} hint={t("adm.allTimeShort")} />
        <StatTile label={t("adm.tile.completionRate")} value={String(completion)} suffix="%" hint={t("adm.cookCountNote", { done: formatNumber(creator.completions), total: formatNumber(creator.cooks) })} />
      </div>

      <Panel className="mt-6" title={t("nav.recipes")} description={t("adm.creatorRecipesNote")} flush>
        {recipes.length === 0 ? (
          <EmptyState title={t("adm.noRecipesYet")} text={t("adm.addFirstRecipe")} />
        ) : (
          <RecipeTable recipes={recipes} showCreator={false} />
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title={t("adm.details")} description={t("adm.detailsNote")}>
          <ActionForm action={updateCreator.bind(null, creator.id)} submitLabel={t("adm.saveChanges")}>
            <CreatorFields values={{ ...creator, telegramUsername: extra?.telegramUsername }} />
          </ActionForm>
        </Panel>

        <div className="space-y-6 self-start">
        <Panel title={t("adm.login.title")} description={creator.userId ? t("adm.login.linked") : t("adm.login.unlinked")}>
          <ActionForm action={issueCreatorLogin.bind(null, creator.id)} submitLabel={creator.userId ? t("adm.login.reset") : t("adm.login.create")}>
            {!creator.userId && (
              <Field label={t("settings.phone")} htmlFor="phone" hint={t("adm.login.phoneHint")}>
                <TextInput id="phone" name="phone" type="tel" inputMode="tel" required placeholder="+998 90 123 45 67" autoComplete="off" />
              </Field>
            )}
          </ActionForm>
          <p className="mt-4 text-sm text-amber-600">{t("adm.login.once")}</p>
        </Panel>
        <Panel title={t("adm.danger")}>
          <ConfirmButton
            action={deleteCreator.bind(null, creator.id)}
            label={t("adm.deleteCreator")}
            warning={t("adm.deleteCreatorWarn", { name: creator.name, count: creator.recipes })}
          />
        </Panel>
        </div>
      </div>
    </>
  );
}
