import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assessTechnical, probeMedia } from "@/ace/media-engine/node/technical-qa";
import { assessRealContinuity } from "@/ace/media-engine/node/continuity";
import { evaluatePremiumOutput } from "@/ace/media-engine";

/**
 * TEST D'INTÉGRATION LOCAL, SANS AUCUN COÛT (§18 du mandat).
 *
 * Prouve la chaîne média complète avec un média SYNTHÉTIQUE fabriqué par
 * ffmpeg : QA technique → continuité réelle → assemblage → optimisation →
 * extraction de frames. Seule la génération IA n'est pas couverte (elle exige
 * un provider authentifié).
 *
 * Le média synthétique n'est JAMAIS présenté comme premium : le test vérifie
 * justement que le premium gate le refuse comme livrable.
 */

const ROOT = path.resolve(__dirname, "../..");
const hasFfmpeg = !spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).error;
const hasFfprobe = !spawnSync("ffprobe", ["-version"], { stdio: "ignore" }).error;

let work: string;

/** Fabrique un rush synthétique court et léger (rapide à encoder). */
function makeClip(file: string, pattern: string, seconds = 1): void {
  // `testsrc` n'a pas encore d'option → « = » ; `color=c=…` en a déjà → « : ».
  const sep = pattern.includes("=") ? ":" : "=";
  const lavfi = `${pattern}${sep}size=320x180:rate=15:duration=${String(seconds)}`;
  const res = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      lavfi,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-an",
      file,
    ],
    { stdio: "ignore" },
  );
  if (res.status !== 0) throw new Error(`ffmpeg a échoué pour ${file} (lavfi: ${lavfi})`);
}

function runScript(script: string, args: string[]) {
  return spawnSync("node", [path.join(ROOT, "scripts/ace/media", script), ...args], {
    encoding: "utf8",
    cwd: ROOT,
  });
}

beforeAll(() => {
  if (!hasFfmpeg) return;
  work = mkdtempSync(path.join(tmpdir(), "ace-pipeline-e2e-"));
  makeClip(path.join(work, "shot-01.mp4"), "testsrc");
  makeClip(path.join(work, "shot-02.mp4"), "testsrc");
  makeClip(path.join(work, "unrelated.mp4"), "color=c=0x101820");
}, 120_000);

afterAll(() => {
  if (work && existsSync(work)) rmSync(work, { recursive: true, force: true });
});

describe.runIf(hasFfmpeg && hasFfprobe)("Pipeline média local — bout en bout, sans coût", () => {
  it("mesure les faits techniques réels d'un média (ffprobe)", () => {
    const facts = probeMedia(path.join(work, "shot-01.mp4"));
    expect(facts.exists).toBe(true);
    expect(facts.readable).toBe(true);
    expect(facts.kind).toBe("video");
    expect(facts.width).toBe(320);
    expect(facts.height).toBe(180);
    expect(facts.durationS).toBeGreaterThan(0.5);
    expect(facts.hasAudio).toBe(false);
  });

  it("REJETTE un fichier corrompu et un fichier absent (faits, pas opinions)", () => {
    const bogus = path.join(work, "corrompu.mp4");
    // Un fichier non vide mais qui n'est pas une vidéo.
    spawnSync("bash", ["-c", `printf 'ceci-n-est-pas-une-video' > ${JSON.stringify(bogus)}`]);
    expect(assessTechnical(bogus).verdict).toBe("REJECT");
    expect(assessTechnical(path.join(work, "inexistant.mp4")).verdict).toBe("REJECT");
  });

  it("applique les contraintes techniques (dimensions insuffisantes ⇒ REJECT)", () => {
    const r = assessTechnical(path.join(work, "shot-01.mp4"), { minWidth: 1920 });
    expect(r.verdict).toBe("REJECT");
    expect(r.failures.join(" ")).toMatch(/Largeur/);
  });

  it("détecte une rupture de continuité RÉELLE entre deux scènes sans rapport", () => {
    const cont = assessRealContinuity(
      path.join(work, "shot-01.mp4"),
      path.join(work, "unrelated.mp4"),
      path.join(work, "cont"),
    );
    expect(cont.verdict).toBe("BROKEN");
    expect(cont.breaks.length).toBeGreaterThan(0);
    // Les deux signaux sont réellement mesurés.
    expect(cont.ssim).not.toBeNull();
    expect(cont.colorDistance).not.toBeNull();
    // Une frame de raccord exploitable a bien été extraite.
    expect(cont.frames.fromLast).not.toBeNull();
    expect(existsSync(cont.frames.fromLast as string)).toBe(true);
  }, 60_000);

  it("ne signale PAS de rupture quand la coupe est volontaire", () => {
    const cont = assessRealContinuity(
      path.join(work, "shot-01.mp4"),
      path.join(work, "unrelated.mp4"),
      path.join(work, "cont2"),
      { expectHardCut: true },
    );
    expect(cont.breaks).toHaveLength(0);
    expect(cont.verdict).not.toBe("BROKEN");
  }, 60_000);

  it("assemble deux rushes en un master cohérent (durée = somme)", () => {
    const out = path.join(work, "master");
    const res = runScript("assemble.mjs", [
      path.join(work, "shot-01.mp4"),
      path.join(work, "shot-02.mp4"),
      "--out",
      out,
      "--json",
    ]);
    expect(res.status).toBe(0);
    const master = path.join(out, "master.mp4");
    expect(existsSync(master)).toBe(true);
    expect(existsSync(path.join(out, "master.webm"))).toBe(true);
    expect(existsSync(path.join(out, "poster.webp"))).toBe(true);

    const facts = probeMedia(master);
    // Deux clips d'1 s ⇒ ~2 s.
    expect(facts.durationS).toBeGreaterThan(1.6);
    expect(facts.durationS).toBeLessThan(2.6);
    // Le scroll-cinéma est muet par défaut.
    expect(facts.hasAudio).toBe(false);
  }, 120_000);

  it("refuse d'assembler quand aucune sortie n'est APPROUVÉE (rien à maquiller)", () => {
    const manifest = path.join(work, "rejected-manifest.json");
    spawnSync("bash", [
      "-c",
      `cat > ${JSON.stringify(manifest)} <<'EOF'
{"entries":[{"shot":"s1","approved":false,"output":"/nowhere/x.mp4"}]}
EOF`,
    ]);
    const res = runScript("assemble.mjs", ["--manifest", manifest, "--out", path.join(work, "no")]);
    expect(res.status).toBe(1);
    expect(`${res.stdout}${res.stderr}`).toMatch(/APPROUVÉE/i);
  });

  it("optimise en variantes desktop/mobile sans jamais upscaler", () => {
    const out = path.join(work, "web");
    const res = runScript("optimize.mjs", [
      path.join(work, "master/master.mp4"),
      "--out",
      out,
      "--json",
    ]);
    expect(res.status).toBe(0);
    const report = JSON.parse(res.stdout) as {
      variants: { variant: string; width: number }[];
      upscaleAvoided: boolean;
      source: { width: number };
    };
    // La source fait 320 px : aucune variante ne doit la dépasser.
    for (const v of report.variants) expect(v.width).toBeLessThanOrEqual(report.source.width);
    expect(report.upscaleAvoided).toBe(true);
    expect(existsSync(path.join(out, "desktop.mp4"))).toBe(true);
    expect(existsSync(path.join(out, "mobile.webm"))).toBe(true);
  }, 120_000);

  it("extrait une séquence de frames exploitable au scroll", () => {
    const out = path.join(work, "frames");
    const res = runScript("frames.mjs", [
      path.join(work, "master/master.mp4"),
      "--out",
      out,
      "--fps",
      "5",
      "--width",
      "160",
    ]);
    expect(res.status).toBe(0);
    const frames = readdirSync(out).filter((f) => f.endsWith(".webp"));
    expect(frames.length).toBeGreaterThanOrEqual(5);
  }, 60_000);

  it("la CLI de QA sort en échec (exit 1) sur un média corrompu, en succès sinon", () => {
    const runQa = (args: string[]) =>
      spawnSync("pnpm", ["exec", "tsx", "scripts/ace/media/qa.ts", ...args], {
        encoding: "utf8",
        cwd: ROOT,
      });

    const bad = runQa([path.join(work, "corrompu.mp4"), "--json"]);
    expect(bad.status).toBe(1);
    const badReport = JSON.parse(bad.stdout) as { summary: { reject: number } };
    expect(badReport.summary.reject).toBe(1);

    const good = runQa([path.join(work, "shot-01.mp4"), "--json"]);
    expect(good.status).toBe(0);
    const goodReport = JSON.parse(good.stdout) as {
      summary: { pass: number };
      results: { artDirectionVerdict: string; requiresHumanReview: boolean }[];
    };
    expect(goodReport.summary.pass).toBe(1);
    // Un PASS technique ne vaut JAMAIS approbation artistique.
    expect(goodReport.results[0]?.artDirectionVerdict).toBe("REVIEW_REQUIRED");
    expect(goodReport.results[0]?.requiresHumanReview).toBe(true);
  }, 120_000);

  it("REFUSE de présenter le média synthétique comme un livrable premium", () => {
    const verdict = evaluatePremiumOutput({
      qualityBar: "photoreal",
      strategy: "video-scroll",
      assets: {
        continuousVideo: true,
        frameSequence: false,
        stillImages: false,
        realModel3d: false,
        depthMaps: false,
      },
      technicalVerdict: "PASS",
      mediaPresent: true,
      isSyntheticTestAsset: true,
    });
    expect(verdict.action).toBe("BLOCK");
    expect(verdict.violations).toContain("TEST_ASSET_AS_FINAL");
  });

  it("produit un rapport d'assemblage traçable (ffprobe du master)", () => {
    const report = JSON.parse(
      readFileSync(path.join(work, "master/assemble-report.json"), "utf8"),
    ) as { mode: string; master: { hasAudio: boolean; durationS: number } };
    expect(["concat-copy", "normalize-concat"]).toContain(report.mode);
    expect(report.master.hasAudio).toBe(false);
    expect(report.master.durationS).toBeGreaterThan(0);
  });
});
