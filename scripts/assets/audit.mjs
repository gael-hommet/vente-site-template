#!/usr/bin/env node
// pnpm assets:audit — report on asset weights & formats without modifying anything.
import {
  INPUT_DIR,
  PUBLIC_DIR,
  BUDGET,
  IMAGE_EXT,
  VIDEO_EXT,
  MODEL_EXT,
  walk,
  fileSize,
  human,
  ext,
  color,
  header,
} from "./util.mjs";

function kindOf(p) {
  const e = ext(p);
  if (IMAGE_EXT.includes(e)) return "image";
  if (VIDEO_EXT.includes(e)) return "video";
  if (MODEL_EXT.includes(e)) return "model";
  return null;
}

async function auditDir(dir, label) {
  const files = await walk(dir);
  const rows = [];
  let total = 0;
  const overweight = [];
  for (const f of files) {
    const kind = kindOf(f);
    if (!kind) continue;
    const size = await fileSize(f);
    total += size;
    const over = size > BUDGET[kind];
    rows.push({ f, kind, size, over });
    if (over) overweight.push({ f, kind, size });
  }

  header(`${label} — ${rows.length} assets, ${human(total)} total`);
  if (rows.length === 0) {
    console.log(color.dim("  (aucun asset détecté)"));
    return { count: rows.length, overweight };
  }
  rows
    .sort((a, b) => b.size - a.size)
    .slice(0, 20)
    .forEach((r) => {
      const tag = r.over ? color.yellow("⚠ over") : color.green("ok");
      const rel = r.f.replace(process.cwd() + "/", "");
      console.log(`  ${tag}  ${human(r.size).padStart(9)}  ${color.dim(r.kind)}  ${rel}`);
    });
  return { count: rows.length, overweight };
}

async function main() {
  console.log(color.bold("\nAudit des assets — lecture seule\n"));
  const input = await auditDir(INPUT_DIR, "input/assets (sources)");
  const pub = await auditDir(PUBLIC_DIR, "public (servis)");

  const allOver = [...input.overweight, ...pub.overweight];
  header("Résumé");
  console.log(`  Sources: ${input.count} | Servis: ${pub.count}`);
  if (allOver.length) {
    console.log(
      color.yellow(
        `  ${allOver.length} asset(s) au-dessus du budget. Lancez pnpm assets:all pour optimiser.`,
      ),
    );
  } else {
    console.log(color.green("  Tous les assets respectent le budget. ✔"));
  }
  console.log(
    color.dim(
      "\n  Rappel: les originaux ne sont jamais écrasés. Les sorties vont dans public/{assets,sequences,models,posters}.\n",
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
