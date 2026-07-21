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
    await page.waitForTimeout(2500);

    let webglChunks = 0;
    for (const u of jsUrls) {
      const res = await page.request.get(u);
      if (WEBGL_SIGNATURE.test(await res.text())) webglChunks++;
    }
    const canvasCount = await page.locator("canvas").count();
    const fallbackCount = await page
      .locator("img[alt*='aperçu'], img[alt*='statique'], img[alt*='poster']")
      .count();

    result = {
      site: path.basename(siteDir),
      expect,
      jsRequests: jsUrls.length,
      webglChunks,
      canvasCount,
      fallbackCount,
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
    // Immersif : soit un chunk WebGL + canvas réel, soit (headless logiciel) un
    // fallback poster monté. Les deux prouvent que le pipeline WebGL est câblé.
    ok = result.webglChunks > 0 || result.canvasCount > 0 || result.fallbackCount > 0;
    result.verdict = ok
      ? "WebGL réel monté (canvas) ou fallback présent (conforme immersif)"
      : "ni WebGL, ni canvas, ni fallback (pipeline WebGL absent)";
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("✗ audit WebGL échoué :", e.message ?? e);
  process.exit(2);
});
