import Link from "next/link";

/** Shown next to the sign-up button: using it means accepting both documents. */
export function LegalConsent() {
  const link = "font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800";
  return (
    <p className="text-sm leading-relaxed text-amber-600">
      Davom etish orqali{" "}
      <Link href="/terms" target="_blank" className={link}>Foydalanish shartlari</Link> va{" "}
      <Link href="/privacy" target="_blank" className={link}>Maxfiylik siyosati</Link>ga rozilik bildirasiz.
    </p>
  );
}
