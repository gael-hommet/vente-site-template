#!/usr/bin/env node
/**
 * MOBILE_QA — contrôle mobile RÉEL (aucun jalon symbolique).
 *
 * Démarre le site construit, ouvre un vrai viewport mobile avec Playwright,
 * prend une capture et MESURE des faits vérifiables :
 *   - débordement horizontal (la plaie n°1 du responsive) ;
 *   - CTA principal réellement visible et assez grand pour le pouce ;
 *   - images effectivement chargées (naturalWidth > 0) ;
 *   - taille de police du corps de texte lisible ;
 *   - contenu présent sans JavaScript de scène (titre h1 unique).
 *
 * Sortie : JSON sur stdout. Aucune supposition — si la capture échoue, le
 * contrôle est déclaré NON effectué plutôt que « réussi ».
 *
 * Usage : node mobile-qa.mjs <siteDir> <outDir>
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const siteDir = process.argv[2];
const outDir = process.argv[3] ?? path.join(ROOT, ".ace/shots");

const fail = (message) => {
  console.log(
    JSON.stringify({ ok: false, screenshot: null, checks: [{ label: message, ok: false }] }),
  );
  process.exit(0);
};

if (!siteDir || !existsSync(siteDir)) fail("dossier du site introuvable");
mkdirSync(outDir, { recursive: true });

/** Port dédié pour ne pas entrer en conflit avec une preview ouverte. */
const PORT = 4499;

// Le site doit être construit pour être servi.
if (!existsSync(path.join(siteDir, ".next"))) {
  const build = spawnSync("pnpm", ["run", "build"], { cwd: siteDir, encoding: "utf8" });
  if (build.status !== 0) fail("build du site impossible avant le contrôle mobile");
}

const server = spawn("pnpm", ["start", "-p", String(PORT)], {
  cwd: siteDir,
  stdio: "ignore",
  detached: true,
});

const stopServer = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* déjà arrêté */
  }
};

/** Attend que le serveur réponde (max ~30 s). */
async function waitForServer(url) {
  for (let i = 0; i < 30; i += 1) {
    const probe = spawnSync("curl", ["-s", "-o", "/dev/null", "-m", "2", url]);
    if (probe.status === 0) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const url = `http://localhost:${String(PORT)}/`;

try {
  const up = await waitForServer(url);
  if (!up) {
    stopServer();
    fail("le site ne répond pas : contrôle mobile non effectué");
  }

  const { chromium, devices } = await import(
    path.join(ROOT, "node_modules/@playwright/test/index.mjs")
  );
  const browser = await chromium.launch();
  const context = await browser.newContext(devices["iPhone 13"]);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

  const screenshot = path.join(outDir, "mobile.png");
  await page.screenshot({ path: screenshot, fullPage: false });

  // Mesures réelles dans le navigateur.
  const measured = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflowPx = Math.max(0, doc.scrollWidth - window.innerWidth);
    const imgs = [...document.querySelectorAll("img")];
    const brokenImages = imgs.filter((i) => i.complete && i.naturalWidth === 0).length;
    const bodySize = parseFloat(getComputedStyle(document.body).fontSize || "0");
    const h1 = document.querySelectorAll("h1").length;

    // Un CTA doit être VISIBLE et assez grand pour être touché confortablement.
    // Un élément masqué en mobile (menu replié) ne doit pas être mesuré : il
    // ferait échouer à tort des pages parfaitement correctes.
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
    };
    const candidates = [...document.querySelectorAll("a, button")].filter(isVisible);
    const cta = candidates.find((el) =>
      /contact|devis|réserv|reserv|appel|rendez/i.test(el.textContent ?? ""),
    );
    const rect = cta?.getBoundingClientRect();
    return {
      overflowPx,
      imageCount: imgs.length,
      brokenImages,
      bodySize,
      h1Count: h1,
      ctaFound: Boolean(cta),
      ctaHeight: rect ? Math.round(rect.height) : 0,
      ctaInViewport: rect ? rect.top < window.innerHeight && rect.bottom > 0 : false,
    };
  });

  await context.close();
  await browser.close();
  stopServer();

  const checks = [
    {
      label: "aucun débordement horizontal",
      ok: measured.overflowPx <= 1,
      detail: measured.overflowPx > 1 ? `${String(measured.overflowPx)} px de trop` : undefined,
    },
    {
      label: "images chargées",
      ok: measured.brokenImages === 0,
      detail: `${String(measured.imageCount)} image(s), ${String(measured.brokenImages)} cassée(s)`,
    },
    {
      label: "texte lisible (≥ 14 px)",
      ok: measured.bodySize >= 14,
      detail: `${String(measured.bodySize)} px`,
    },
    {
      label: "un seul h1",
      ok: measured.h1Count === 1,
      detail: `${String(measured.h1Count)} trouvé(s)`,
    },
    { label: "CTA présent", ok: measured.ctaFound },
    {
      label: "CTA assez grand pour le pouce (≥ 40 px)",
      ok: !measured.ctaFound || measured.ctaHeight >= 40,
      detail: measured.ctaFound ? `${String(measured.ctaHeight)} px` : undefined,
    },
  ];

  console.log(
    JSON.stringify({ ok: checks.every((c) => c.ok), screenshot, checks, measured }, null, 2),
  );
} catch (e) {
  stopServer();
  fail(`contrôle mobile interrompu : ${e instanceof Error ? e.message : String(e)}`);
}
