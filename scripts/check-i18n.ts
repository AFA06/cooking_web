import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Keeps the four language files in step:
 *   - every language has exactly the same keys as Uzbek (the source language);
 *   - every {placeholder} in the Uzbek text exists in the translation;
 *   - every literal t("...") key used in the code exists in the dictionary.
 * Run with: npx tsx scripts/check-i18n.ts
 */
const LOCALES = ["uz", "ru", "en", "kz"] as const;
type Tree = { [k: string]: string | Tree };

const load = (l: string): Tree => JSON.parse(readFileSync(join("src/i18n/messages", `${l}.json`), "utf8"));
const isPlural = (v: unknown): v is Record<string, string> =>
  typeof v === "object" && v !== null && "other" in v && Object.values(v).every((x) => typeof x === "string");

function flatten(tree: Tree, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else if (isPlural(v)) out[key] = Object.values(v).join("\n");
    else flatten(v as Tree, key, out);
  }
  return out;
}

const messages = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))])) as Record<(typeof LOCALES)[number], Record<string, string>>;
const problems: string[] = [];
const vars = (s: string) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

for (const l of LOCALES) {
  if (l === "uz") continue;
  for (const key of Object.keys(messages.uz)) {
    if (!(key in messages[l])) problems.push(`[${l}] missing: ${key}`);
    else {
      for (const v of vars(messages.uz[key])) if (!vars(messages[l][key]).has(v) && v !== "count") problems.push(`[${l}] ${key}: placeholder {${v}} missing`);
    }
  }
  for (const key of Object.keys(messages[l])) if (!(key in messages.uz)) problems.push(`[${l}] extra: ${key}`);
}

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name)) yield p;
  }
}
const used = new Set<string>();
for (const file of walk("src")) {
  if (file.startsWith("src/i18n/")) continue;
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/\bt\(\s*["']([\w.]+)["']/g)) used.add(m[1]);
}
for (const key of used) if (!(key in messages.uz)) problems.push(`used in code but not defined: ${key}`);

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`i18n OK — ${Object.keys(messages.uz).length} keys × ${LOCALES.length} languages, ${used.size} keys used in code.`);
