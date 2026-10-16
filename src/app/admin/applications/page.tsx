import type { Metadata } from "next";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/admin/ActionForm";
import { EmptyState, PageHeader, Panel, SegmentedLinks, StatusPill, TextArea } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { getLocale, getT } from "@/i18n/server";
import { formatPhone } from "@/lib/profile";
import { formatRelative } from "@/lib/format";
import { requireAdminPage } from "@/server/admin";
import { listApplications, type ApplicationStatus } from "@/server/applications";
import { approveApplication, rejectApplication } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("apply.adm.title") };
}

const STATUSES: ApplicationStatus[] = ["pending", "approved", "rejected"];
const TONE = { pending: "accent", approved: "good", rejected: "warn" } as const;

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [, t, locale, sp] = await Promise.all([requireAdminPage(), getT(), getLocale(), searchParams]);
  const status = (STATUSES as string[]).includes(sp.status ?? "") ? (sp.status as ApplicationStatus) : "pending";
  const items = await listApplications(status);

  return (
    <>
      <PageHeader
        eyebrow={t("adm.nav.creators")}
        title={t("apply.adm.title")}
        description={t("apply.adm.desc")}
        actions={
          <SegmentedLinks
            label={t("apply.adm.title")}
            items={STATUSES.map((s) => ({ href: s === "pending" ? "/admin/applications" : `/admin/applications?status=${s}`, label: t(`apply.adm.status.${s}`), active: s === status }))}
          />
        }
      />

      {items.length === 0 ? (
        <Panel><EmptyState title={t(`apply.adm.empty.${status}`)} /></Panel>
      ) : (
        <ul className="grid gap-6 xl:grid-cols-2">
          {items.map((a) => (
            <li key={a.id}>
              <Panel className="h-full">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl font-medium text-amber-950">{a.fullName}</h2>
                    <p className="mt-1 text-sm text-amber-600">
                      {formatRelative(a.createdAt.toISOString(), t, locale)} ·{" "}
                      <Link href={`/admin/users/${a.userId}`} className="text-amber-700 hover:underline">{t("apply.adm.account", { name: a.accountName })}</Link>
                    </p>
                  </div>
                  <StatusPill tone={TONE[a.status]}>{t(`apply.adm.status.${a.status}`)}</StatusPill>
                </div>

                <dl className="mt-5 grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="text-amber-600">{t("apply.phone")}</dt>
                  <dd className="font-medium text-amber-950">{formatPhone(a.phone)}</dd>
                  <dt className="text-amber-600">{t("apply.audience")}</dt>
                  <dd className="font-medium text-amber-950">{t(`apply.size.${a.audience}`)}</dd>
                  {a.instagram && (
                    <>
                      <dt className="text-amber-600">Instagram</dt>
                      <dd className="min-w-0"><a href={a.instagram} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1 break-all font-medium text-amber-700 hover:underline">{a.instagram.replace(/^https:\/\//, "")}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a></dd>
                    </>
                  )}
                  {a.telegram && (
                    <>
                      <dt className="text-amber-600">Telegram</dt>
                      <dd className="min-w-0"><a href={a.telegram} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1 break-all font-medium text-amber-700 hover:underline">{a.telegram.replace(/^https:\/\//, "")}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a></dd>
                    </>
                  )}
                </dl>
                <p className="mt-4 whitespace-pre-line rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">{a.about}</p>
                {a.adminNote && <p className="mt-3 text-sm text-amber-600">{t("apply.adm.note")}: {a.adminNote}</p>}

                {a.status === "pending" && (
                  <div className="mt-6 space-y-4 border-t border-amber-200 pt-5">
                    <form action={approveApplication.bind(null, a.id)}>
                      <Button type="submit"><Check className="h-4 w-4" aria-hidden="true" />{t("apply.adm.approve")}</Button>
                      <p className="mt-2 text-xs text-amber-600">{t("apply.adm.approveHint")}</p>
                    </form>
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-red-700">{t("apply.adm.reject")}</summary>
                      <div className="mt-3">
                        <ActionForm action={rejectApplication.bind(null, a.id)} submitLabel={t("apply.adm.rejectConfirm")}>
                          <TextArea name="note" rows={2} maxLength={300} placeholder={t("apply.adm.notePlaceholder")} aria-label={t("apply.adm.note")} />
                        </ActionForm>
                      </div>
                    </details>
                  </div>
                )}
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
