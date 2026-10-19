import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, CheckCircle2, Flame } from "lucide-react";
import { z } from "zod";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { EmptyState, Field, PageHeader, Panel, SelectInput, StatTile, TextInput } from "@/components/admin/ui";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatRelative, formatShortDate } from "@/lib/format";
import { getUserActivity, getUserAdmin, requireAdminPage } from "@/server/admin";
import { deleteUser, setUserBlocked, updateUser } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Ban, ShieldCheck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("role.user") };
}

const ACTIVITY = {
  save: { label: "adm.act.save", icon: Bookmark },
  cook_start: { label: "adm.act.cook_start", icon: Flame },
  cook_done: { label: "adm.act.cook_done", icon: CheckCircle2 },
} as const;

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const [admin, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await getUserAdmin(id);
  if (!user) notFound();
  const activity = await getUserActivity(id);
  const isSelf = user.id === admin.id;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/users", label: t("adm.nav.users") }}
        title={user.name}
        description={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span>{user.contact ?? "—"}</span>
            {user.blockedAt && <span className="font-semibold text-red-700">{t("adm.blockedSince", { date: formatShortDate(user.blockedAt, locale) })}</span>}
            <span>{t("adm.registeredOn", { date: formatShortDate(user.createdAt, locale) })}</span>
            {user.creatorId && (
              <Link href={`/admin/creators/${user.creatorId}`} className="text-amber-700 hover:underline">{t("adm.creatorProfile", { name: user.creatorName ?? "" })}</Link>
            )}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("account.savedRecipes")} value={formatNumber(user.saves)} />
        <StatTile label={t("adm.tile.cooksStarted")} value={formatNumber(user.cooks)} />
        <StatTile label={t("account.completed")} value={formatNumber(user.completions)} />
        <StatTile label={t("adm.lastSeen")} value={user.lastSeenAt ? formatShortDate(user.lastSeenAt, locale).split(" ")[0] : "—"} hint={formatRelative(user.lastSeenAt, t, locale)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t("adm.activity")} description={t("adm.activityNote")} flush>
          {activity.length === 0 ? (
            <EmptyState title={t("adm.noActivity")} text={t("adm.noActivityText")} />
          ) : (
            <ul className="divide-y divide-amber-100">
              {activity.map((a, i) => {
                const { label, icon: Icon } = ACTIVITY[a.kind];
                return (
                  <li key={`${a.kind}-${a.at}-${i}`} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-amber-950">
                      {t(label)}:{" "}
                      <Link href={`/recipes/${a.recipeSlug}`} className="font-medium hover:text-amber-700 hover:underline">{a.recipeTitle}</Link>
                    </span>
                    <span className="shrink-0 text-xs text-amber-600">{formatRelative(a.at, t, locale)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel title={t("adm.details")}>
            <ActionForm action={updateUser.bind(null, user.id)} submitLabel={t("adm.saveChanges")}>
              <Field label={t("auth.name")} htmlFor="name">
                <TextInput id="name" name="name" required maxLength={80} defaultValue={user.name} />
              </Field>
              <Field label={t("auth.email")} htmlFor="email">
                <TextInput id="email" name="email" type="email" maxLength={254} defaultValue={user.email ?? ""} />
              </Field>
              <Field label={t("adm.role")} htmlFor="role" hint={isSelf ? t("adm.roleHintSelf") : t("adm.roleHint")}>
                <SelectInput id="role" name="role" defaultValue={user.role}>
                  <option value="user">{t("role.user")}</option>
                  <option value="creator">{t("role.creator")}</option>
                  <option value="admin">{t("role.admin")}</option>
                </SelectInput>
              </Field>
            </ActionForm>
          </Panel>

          {!isSelf && (
            <Panel title={t("adm.access")} description={user.blockedAt ? t("adm.blockedNote") : t("adm.blockNote")}>
              <form action={setUserBlocked.bind(null, user.id, !user.blockedAt)}>
                {user.blockedAt ? (
                  <Button type="submit" variant="secondary"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{t("adm.unblock")}</Button>
                ) : (
                  <Button type="submit" variant="outline" className="border-red-700/40 text-red-700 hover:bg-red-600/5"><Ban className="h-4 w-4" aria-hidden="true" />{t("adm.block")}</Button>
                )}
              </form>
            </Panel>
          )}

          <Panel title={t("adm.danger")}>
            {isSelf ? (
              <p className="text-sm text-amber-600">{t("adm.cannotDeleteSelf")}</p>
            ) : (
              <ConfirmButton
                action={deleteUser.bind(null, user.id)}
                label={t("adm.deleteUser")}
                warning={`${t("adm.deleteUserWarn", { name: user.name })}${user.creatorId ? t("adm.deleteUserKeep") : ""}`}
              />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
