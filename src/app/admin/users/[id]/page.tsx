import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, CheckCircle2, Flame } from "lucide-react";
import { z } from "zod";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { EmptyState, Field, PageHeader, Panel, SelectInput, StatTile, TextInput } from "@/components/admin/ui";
import { formatNumber, formatRelative, formatShortDate } from "@/lib/format";
import { getUserActivity, getUserAdmin, requireAdminPage } from "@/server/admin";
import { deleteUser, updateUser } from "../../actions";

export const metadata: Metadata = { title: "Foydalanuvchi" };

const ACTIVITY = {
  save: { label: "Retseptni saqladi", icon: Bookmark },
  cook_start: { label: "Pishirishni boshladi", icon: Flame },
  cook_done: { label: "Pishirib bo‘ldi", icon: CheckCircle2 },
} as const;

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await getUserAdmin(id);
  if (!user) notFound();
  const activity = await getUserActivity(id);
  const isSelf = user.id === admin.id;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/users", label: "Foydalanuvchilar" }}
        title={user.name}
        description={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span>{user.email}</span>
            <span>Ro‘yxatdan o‘tgan: {formatShortDate(user.createdAt)}</span>
            {user.creatorId && (
              <Link href={`/admin/creators/${user.creatorId}`} className="text-amber-700 hover:underline">Ijodkor profili: {user.creatorName}</Link>
            )}
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Saqlangan retseptlar" value={formatNumber(user.saves)} />
        <StatTile label="Pishirish boshlangan" value={formatNumber(user.cooks)} />
        <StatTile label="Tugatilgan" value={formatNumber(user.completions)} />
        <StatTile label="Oxirgi kirish" value={user.lastSeenAt ? formatShortDate(user.lastSeenAt).split(" ")[0] : "—"} hint={formatRelative(user.lastSeenAt)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Faollik" description="So‘nggi harakatlar" flush>
          {activity.length === 0 ? (
            <EmptyState title="Hali faollik yo‘q" text="Foydalanuvchi retsept saqlasa yoki pishirsa, shu yerda ko‘rinadi." />
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
                      {label}:{" "}
                      <Link href={`/recipes/${a.recipeSlug}`} className="font-medium hover:text-amber-700 hover:underline">{a.recipeTitle}</Link>
                    </span>
                    <span className="shrink-0 text-xs text-amber-600">{formatRelative(a.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel title="Ma’lumotlar">
            <ActionForm action={updateUser.bind(null, user.id)} submitLabel="O‘zgarishlarni saqlash">
              <Field label="Ism" htmlFor="name">
                <TextInput id="name" name="name" required maxLength={80} defaultValue={user.name} />
              </Field>
              <Field label="Email" htmlFor="email">
                <TextInput id="email" name="email" type="email" required maxLength={254} defaultValue={user.email} />
              </Field>
              <Field label="Rol" htmlFor="role" hint={isSelf ? "O‘zingizning admin huquqingizni olib tashlay olmaysiz." : "Admin barcha ma’lumotlarni boshqara oladi."}>
                <SelectInput id="role" name="role" defaultValue={user.role}>
                  <option value="user">Foydalanuvchi</option>
                  <option value="creator">Ijodkor</option>
                  <option value="admin">Admin</option>
                </SelectInput>
              </Field>
            </ActionForm>
          </Panel>

          <Panel title="Xavfli hudud">
            {isSelf ? (
              <p className="text-sm text-amber-600">O‘z hisobingizni bu yerdan o‘chira olmaysiz.</p>
            ) : (
              <ConfirmButton
                action={deleteUser.bind(null, user.id)}
                label="Foydalanuvchini o‘chirish"
                warning={`“${user.name}” hisobi, saqlagan retseptlari va pishirish tarixi butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.${user.creatorId ? " Ijodkor profili va retseptlari saqlanib qoladi." : ""}`}
              />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
