import { Search } from "lucide-react";

/** Plain GET form: works without JavaScript and lands on the recipe explorer. */
export function SearchBar({ defaultValue, autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/recipes" role="search" className="relative">
      <label htmlFor="home-search" className="sr-only">Retsept qidirish</label>
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
      <input
        id="home-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Osh, lag‘mon yoki masalliq nomi…"
        className="h-[3.75rem] w-full rounded-2xl border border-amber-300 bg-amber-100 pl-14 pr-32 text-lg text-amber-950 shadow-[0_1px_2px_rgb(44_40_37/0.04)] placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
      />
      <button type="submit" className="absolute right-2 top-1/2 h-11 -translate-y-1/2 rounded-xl bg-amber-950 px-5 text-[0.95rem] font-semibold text-amber-50 transition-colors hover:bg-amber-900">
        Qidirish
      </button>
    </form>
  );
}
