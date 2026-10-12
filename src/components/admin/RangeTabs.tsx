import { SegmentedLinks } from "@/components/admin/ui";
import { RANGE_LABEL, withQuery } from "@/lib/admin-stats";
import { getT } from "@/i18n/server";
import { RANGES, type Range } from "@/server/admin";

export async function RangeTabs({ base, range }: { base: string; range: Range }) {
  const t = await getT();
  return (
    <SegmentedLinks
      label={t("adm.range.label")}
      items={RANGES.map((r) => ({ href: withQuery(base, { range: r === 30 ? undefined : r }), label: t(RANGE_LABEL[r]), active: r === range }))}
    />
  );
}
