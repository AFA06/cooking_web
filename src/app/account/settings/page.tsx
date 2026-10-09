import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, KeyRound, Mail, UserRound } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";
import { EmailForm, PasswordForm, ProfileForm } from "@/components/account/SettingsForms";
import { db, schema } from "@/db";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/profile";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Profil sozlamalari", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { user: "Foydalanuvchi", creator: "Ijodkor", admin: "Admin" } as const;

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/settings");
  const [details] = await db
    .select({ username: schema.users.username, phone: schema.users.phone, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  const sections = [
    {
      id: "profil",
      icon: UserRound,
      title: "Shaxsiy ma’lumotlar",
      note: "Ismingiz retsept baholarida ko‘rinadi.",
      form: <ProfileForm initial={{ name: user.name, username: details.username ?? "", phone: details.phone ? formatPhone(details.phone) : "" }} />,
    },
    { id: "email", icon: Mail, title: "Email", note: "Tizimga shu email bilan kirasiz.", form: <EmailForm email={user.email} /> },
    { id: "parol", icon: KeyRound, title: "Parol", note: "O‘zgartirilgach, boshqa qurilmalardagi sessiyalar yopiladi.", form: <PasswordForm /> },
  ];

  return (
    <SiteShell>
      <Container size="xl" className="grid gap-12 py-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-24 lg:py-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 transition-colors hover:text-amber-950">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Mening oshxonam
          </Link>
          <span className="mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-sage-500 font-serif text-5xl font-medium text-amber-50" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Profil sozlamalari</p>
          <h1 className="mt-3 break-words font-serif text-[2.6rem] font-medium leading-[1.05] text-amber-950 sm:text-5xl">{user.name}</h1>
          {details.username && <p className="mt-2 text-lg text-amber-600">@{details.username}</p>}
          <dl className="mt-8 divide-y divide-amber-200 border-y border-amber-200 text-[0.95rem]">
            {[
              ["Email", user.email],
              ["Hisob turi", ROLE_LABEL[user.role]],
              ["A’zo bo‘lgan sana", formatDate(details.createdAt)],
            ].map(([term, value]) => (
              <div key={term} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-amber-600">{term}</dt>
                <dd className="min-w-0 truncate font-medium text-amber-950">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="max-w-2xl">
          {sections.map(({ id, icon: Icon, title, note, form }) => (
            <section key={id} id={`sozlama-${id}`} aria-labelledby={`${id}-heading`} className="scroll-mt-28 border-t border-amber-200 py-10 first:border-t-0 first:pt-0">
              <div className="mb-7 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-clay-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id={`${id}-heading`} className="font-serif text-2xl font-medium text-amber-950">{title}</h2>
                  <p className="mt-1 text-amber-600">{note}</p>
                </div>
              </div>
              {form}
            </section>
          ))}
        </div>
      </Container>
    </SiteShell>
  );
}
