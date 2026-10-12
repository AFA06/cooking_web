import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { CookbookSummary } from "@/server/cookbooks";

/** A cookbook as a tile: its newest recipe large, the next two beside it. */
export function CookbookCard({ cookbook }: { cookbook: CookbookSummary }) {
  const [first, ...rest] = cookbook.coverUrls;
  return (
    <Link href={`/account/cookbooks/${cookbook.id}`} className="group block">
      <div className="grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-[1.25rem] bg-amber-100">
        {first ? (
          <>
            <span className={rest.length > 0 ? "relative col-span-2 row-span-2" : "relative col-span-3 row-span-2"}>
              <Image src={first} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
            </span>
            {rest.map((url, i) => (
              <span key={url + i} className={rest.length === 1 ? "relative row-span-2" : "relative"}>
                <Image src={url} alt="" fill sizes="(max-width: 640px) 34vw, 11vw" className="object-cover" />
              </span>
            ))}
          </>
        ) : (
          <span className="col-span-3 row-span-2 flex items-center justify-center text-amber-400">
            <BookOpen className="h-10 w-10" strokeWidth={1.25} aria-hidden="true" />
          </span>
        )}
      </div>
      <h3 className="mt-4 truncate text-2xl font-medium leading-tight text-amber-950 group-hover:text-amber-700">{cookbook.name}</h3>
      <p className="mt-1 text-sm text-amber-600">{cookbook.recipeCount === 0 ? "Hozircha bo‘sh" : `${cookbook.recipeCount} ta retsept`}</p>
    </Link>
  );
}
