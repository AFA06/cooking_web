"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SocialIcon } from "@/components/creator/SocialLinks";
import { updateCreatorProfile } from "@/app/dashboard/actions";
import { SOCIAL_PLATFORMS, normalizeSocialUrl, type SocialLinks, type SocialPlatform } from "@/lib/social";

const field = "mt-1.5 w-full min-h-12 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";
const label = "text-sm font-medium text-amber-950";

interface Props {
  initial: { name: string; bio: string; avatarUrl: string; socialLinks: SocialLinks };
}

export function CreatorProfileEditor({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = React.useState(initial.name);
  const [bio, setBio] = React.useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = React.useState(initial.avatarUrl);
  const [links, setLinks] = React.useState<SocialLinks>(initial.socialLinks);
  const [adding, setAdding] = React.useState<SocialPlatform | "">("");
  const [draft, setDraft] = React.useState("");
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const available = SOCIAL_PLATFORMS.filter((p) => !links[p.key]);
  const addingConfig = SOCIAL_PLATFORMS.find((p) => p.key === adding);

  const addLink = () => {
    if (!adding) return;
    const url = normalizeSocialUrl(adding, draft);
    if (!url) return setLinkError(`Bu ${addingConfig?.label} profili havolasiga o‘xshamaydi. Havolani yoki foydalanuvchi nomini kiriting.`);
    setLinks((current) => ({ ...current, [adding]: url }));
    setAdding("");
    setDraft("");
    setLinkError(null);
    setMessage(null);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCreatorProfile({ name, bio, avatarUrl, socialLinks: links as Record<string, string> });
      if (result.error) return setMessage({ kind: "error", text: result.error });
      setMessage({ kind: "ok", text: "Profil saqlandi." });
      router.refresh();
    });
  };

  return (
    <form onSubmit={save} className="space-y-10">
      <section className="space-y-5">
        <h2 className="text-2xl font-medium text-amber-950">Asosiy ma’lumotlar</h2>
        <div>
          <label htmlFor="name" className={label}>Ko‘rinadigan ism</label>
          <input id="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="bio" className={label}>Tanishtiruv</label>
          <textarea id="bio" rows={4} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Qanday taomlar pishirasiz? Tajribangiz haqida qisqacha." className={field} />
          <p className="mt-1 text-xs text-amber-600">{bio.length} / 500</p>
        </div>
        <div>
          <label htmlFor="avatar" className={label}>Profil rasmi havolasi</label>
          <input id="avatar" type="url" maxLength={1000} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className={field} />
          <p className="mt-1 text-xs text-amber-600">Rasm yuklash hozircha mavjud emas — rasm havolasini kiriting.</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-medium text-amber-950">Ijtimoiy tarmoqlar</h2>
        <p className="mt-1 text-amber-900">Qo‘shilgan hisoblar ommaviy profilingizda, tanishtiruv ostida ko‘rinadi.</p>

        {Object.keys(links).length > 0 && (
          <ul className="mt-5 divide-y divide-amber-200 border-y border-amber-200">
            {SOCIAL_PLATFORMS.filter((p) => links[p.key]).map((p) => (
              <li key={p.key} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-950">
                  <SocialIcon platform={p.key} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-amber-950">{p.label}</span>
                  <span className="block truncate text-sm text-amber-600">{links[p.key]}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLinks((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== p.key)) as SocialLinks)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 hover:text-red-700"
                  aria-label={`${p.label} hisobini olib tashlash`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {available.length > 0 && (
          <div className="mt-5 rounded-2xl bg-amber-100 p-5">
            <p className={label}>Ijtimoiy tarmoq qo‘shish</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {available.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={adding === p.key}
                  onClick={() => {
                    setAdding(p.key);
                    setDraft("");
                    setLinkError(null);
                  }}
                  className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[0.95rem] font-medium transition-colors ${adding === p.key ? "border-amber-950 bg-amber-950 text-amber-50" : "border-amber-300 bg-white text-amber-950 hover:border-amber-950"}`}
                >
                  <SocialIcon platform={p.key} />
                  {p.label}
                </button>
              ))}
            </div>
            {addingConfig && (
              <div className="mt-4">
                <label htmlFor="social-link" className={label}>{addingConfig.label} profilingiz havolasi</label>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="social-link"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLink();
                      }
                    }}
                    placeholder={addingConfig.placeholder}
                    className="min-h-12 flex-1 rounded-xl border border-amber-300 bg-white px-4 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
                  />
                  <Button type="button" onClick={addLink}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Qo‘shish
                  </Button>
                </div>
                {linkError && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{linkError}</p>}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-amber-200 pt-6">
        <Button type="submit" size="lg" loading={pending}>Profilni saqlash</Button>
        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm font-medium ${message.kind === "error" ? "text-red-700" : "text-sage-700"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
