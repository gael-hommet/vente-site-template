#!/usr/bin/env node
/**
 * ace:audit-webgl — preuve DURABLE et reproductible du comportement WebGL d'un
 * site généré. Boote le site (pnpm start), charge sa home dans Chromium, et
 * mesure réellement :
 *   - combien de chunks JS chargés contiennent du code three.js/R3F ;
 *   - combien de <canvas> sont montés ;
 *   - la présence d'un poster/fallback.
 *
 * Usage :
 *   node scripts/ace/audit-webgl.mjs <dossier-site> --expect none|webgl [--port 3300]
 *
 * `--expect none`  : ÉCHOUE si un chunk WebGL est chargé (site éditorial).
 * `--expect webgl` : ÉCHOUE si aucun chunk WebGL n'est chargé ET aucun canvas
 *                    ni fallback n'est présent (site immersif ; en headless
 *                    logiciel le tier peut retomber sur le fallback — accepté).
 *
 * Produit un JSON de preuve exploitable sur stdout (et un code de sortie).
 * Script INTERNE au moteur (élagué des sites générés). Aucune modification du
 * site audité.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const opt = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : d;
};
const siteDir = args[0] && !args[0].startsWith("--") ? path.resolve(args[0]) : null;
const expect = opt("--expect", "none");
const port = Number(opt("--port", "3300"));

if (!siteDir || !existsSync(siteDir)) {
  console.error(`✗ dossier de site introuvable : ${siteDir}`);
  process.exit(2);
}
if (!["none", "webgl"].includes(expect)) {
  console.error(`✗ --expect doit être "none" ou "webgl" (reçu : ${expect})`);
  process.exit(2);
}

const WEBGL_SIGNATURE = /WebGLRenderer|BufferGeometry|PerspectiveCamera/;

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      /* pas encore prêt */
    }
    if (Date.now() - start > timeoutMs) throw new Error("serveur non prêt (timeout)");
    await sleep(500);
  }
}

/** Fait défiler la page de haut en bas (déclenche les montages lazy au scroll). */
async function scrollFullPage(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, window.innerHeight * 0.8);
    const height = () => document.body.scrollHeight;
    for (let y = 0; y < height(); y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
  });
}

async function main() {
  const base = `http://127.0.0.1:${port}`;
  const server = spawn("pnpm", ["start", "-p", String(port)], {
    cwd: siteDir,
    stdio: "ignore",
    detached: true,
  });

  let result;
  try {
    await waitForServer(base + "/", 60_000);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const jsUrls = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".js")) jsUrls.push(r.url());
    });
    await page.goto(base + "/", { waitUntil: "networkidle" });
    // Défilement complet : les scènes sont lazy (montées à l'entrée dans le
    // viewport). Sans scroll, un chunk WebGL déclenché plus bas ne serait
    // jamais requêté → le « 0 WebGL » couvre l'ensemble de la page, pas
    // seulement le premier écran.
    await scrollFullPage(page);
    await page.waitForTimeout(2500);

    let webglChunks = 0;
    for (const u of jsUrls) {
      const res = await page.request.get(u);
      if (WEBGL_SIGNATURE.test(await res.text())) webglChunks++;
    }
    const canvasCount = await page.locator("canvas").count();
    const fallbackSelector = "img[alt*='aperçu'], img[alt*='statique'], img[alt*='poster']";
    const fallbackCount = await page.locator(fallbackSelector).count();

    // Passe reduced-motion (mode webgl uniquement) : la scène doit dégrader vers
    // le poster/fallback (pas de canvas animé autonome), contenu toujours lisible.
    let reducedMotion = null;
    if (expect === "webgl") {
      const rmPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await rmPage.emulateMedia({ reducedMotion: "reduce" });
      await rmPage.goto(base + "/", { waitUntil: "domcontentloaded" });
      await scrollFullPage(rmPage);
      await rmPage.waitForTimeout(3500); // laisser le poster (next/image) peindre
      reducedMotion = {
        canvasCount: await rmPage.locator("canvas").count(),
        fallbackCount: await rmPage.locator(fallbackSelector).count(),
        h1Visible: await rmPage.getByRole("heading", { level: 1 }).first().isVisible(),
      };
      await rmPage.close();
    }

    result = {
      site: path.basename(siteDir),
      expect,
      jsRequests: jsUrls.length,
      webglChunks,
      canvasCount,
      fallbackCount,
      reducedMotion,
    };
    await browser.close();
  } finally {
    try {
      process.kill(-server.pid);
    } catch {
      /* déjà mort */
    }
  }

  let ok;
  if (expect === "none") {
    ok = result.webglChunks === 0 && result.canvasCount === 0;
    result.verdict = ok
      ? "AUCUN WebGL chargé (conforme éditorial)"
      : "WebGL chargé alors qu'attendu ABSENT";
  } else {
    // Immersif — preuve STRICTE (pas de faux positif fallback-only) :
    // (1) le pipeline WebGL est réellement câblé ⇒ un CHUNK three.js est
    //     téléchargé (le chunk prouve le câblage même si le GL logiciel
    //     retombe ensuite sur le poster ; un fallback SANS chunk = scène cassée
    //     ou éditorial, donc REFUSÉ) ;
    // (2) sous reduced-motion, la scène dégrade EXPLICITEMENT vers un poster
    //     visible (fallbackCount > 0) — l'absence de canvas ne suffit pas.
    const pipelineOk = result.webglChunks > 0;
    const rm = result.reducedMotion;
    const reducedOk = !!rm && rm.h1Visible && rm.fallbackCount > 0 && rm.canvasCount === 0;
    ok = pipelineOk && reducedOk;
    result.verdict = ok
      ? "WebGL réellement câblé (chunk three.js chargé) + dégradation reduced-motion vers poster visible"
      : !pipelineOk
        ? "aucun chunk WebGL chargé (pipeline absent ou scène cassée ; un fallback seul ne prouve pas le câblage)"
        : "chunk WebGL OK mais dégradation reduced-motion non prouvée (poster attendu, canvas interdit)";
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("✗ audit WebGL échoué :", e.message ?? e);
  process.exit(2);
});
