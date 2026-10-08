import { SegmentedLinks } from "@/components/admin/ui";
import { RANGE_LABEL, withQuery } from "@/lib/admin-stats";
import { RANGES, type Range } from "@/server/admin";

export function RangeTabs({ base, range }: { base: string; range: Range }) {
  return (
    <SegmentedLinks
      label="Davr"
      items={RANGES.map((r) => ({ href: withQuery(base, { range: r === 30 ? undefined : r }), label: RANGE_LABEL[r], active: r === range }))}
    />
  );
}
