import { describe, expect, it, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Tests du CLI `ace:new-site` (scripts/ace/new-site.mjs). Chaque test lance le
 * script réel dans un dossier temporaire isolé (jamais dans le dépôt) et
 * nettoie systématiquement, y compris en cas d'échec du test.
 *
 * `--skip-install --skip-check` est utilisé pour toute assertion structurelle
 * (rapide, déterministe) : l'installation + les quality gates du site généré
 * sont vérifiées séparément par le témoin réel (voir docs/ACE-GENERATOR-QUALITY-GATES.md).
 */

const ROOT = path.resolve(__dirname, "../..");
const SCRIPT = path.join(ROOT, "scripts/ace/new-site.mjs");

const cleanupDirs: string[] = [];
afterEach(() => {
  while (cleanupDirs.length > 0) {
    const dir = cleanupDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

function tmpOut(prefix: string) {
  const dir = mkdtempSync(path.join(tmpdir(), `ace-cli-${prefix}-`));
  rmSync(dir, { recursive: true, force: true }); // le CLI doit créer lui-même le dossier
  cleanupDirs.push(dir);
  return dir;
}

function runCli(argv: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...argv], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { status?: number; stdout?: Buffer; stderr?: Buffer };
    return {
      status: err.status ?? 1,
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
    };
  }
}

describe("ace:new-site CLI — aide", () => {
  it("affiche l'aide et sort en 0 avec --help", () => {
    const res = runCli(["--help"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("ace:new-site");
    expect(res.stdout).toContain("--config");
    expect(res.stdout).toContain("--out");
  });
});

describe("ace:new-site CLI — validation des arguments", () => {
  it("refuse l'absence de --name", () => {
    const out = tmpOut("no-name");
    const res = runCli(["--out", out]);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/--name/);
  });

  it("refuse l'absence de --out", () => {
    const res = runCli(["--name", "Test"]);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/--out/);
  });

  it("refuse un fichier de config absent", () => {
    const out = tmpOut("bad-config-path");
    const res = runCli([
      "--name",
      "Test",
      "--out",
      out,
      "--config",
      "input/does-not-exist.config.ts",
    ]);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/configuration introuvable/);
  });

  it("refuse un brief absent", () => {
    const out = tmpOut("bad-brief-path");
    const res = runCli(["--name", "Test", "--out", out, "--brief", "input/does-not-exist.md"]);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/brief introuvable/);
  });

  it("refuse un dossier d'assets absent quand --assets est fourni", () => {
    const out = tmpOut("bad-assets-path");
    const res = runCli(["--name", "Test", "--out", out, "--assets", "input/does-not-exist-assets"]);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/assets introuvable/);
  });

  it("refuse une sortie existante et non vide sans --force", () => {
    const out = tmpOut("existing-out");
    // Génère un premier site pour rendre le dossier non vide.
    const first = runCli(["--name", "Premier", "--out", out, "--skip-install", "--skip-check"]);
    expect(first.status).toBe(0);
    const second = runCli(["--name", "Second", "--out", out, "--skip-install", "--skip-check"]);
    expect(second.status).not.toBe(0);
    expect(second.stderr).toMatch(/n'est pas vide/);
  });
});

describe("ace:new-site CLI — validation de la configuration client", () => {
  it("refuse une configuration invalide (identity.name manquant)", () => {
    const out = tmpOut("invalid-config");
    const cfgPath = path.join(tmpdir(), `ace-cli-invalid-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "" } };\nexport default config;\n`,
    );
    try {
      const res = runCli(["--name", "Test", "--out", out, "--config", cfgPath]);
      expect(res.status).not.toBe(0);
      expect(res.stderr).toMatch(/[Cc]onfiguration client invalide/);
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });

  it("refuse une recipe inconnue avant toute écriture sur disque", () => {
    const out = tmpOut("unknown-recipe");
    const cfgPath = path.join(tmpdir(), `ace-cli-unknown-recipe-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Test" }, recipes: { hero: "does-not-exist" } };\nexport default config;\n`,
    );
    try {
      const res = runCli(["--name", "Test", "--out", out, "--config", cfgPath]);
      expect(res.status).not.toBe(0);
      expect(res.stderr).toMatch(/does-not-exist/);
      expect(existsSync(out)).toBe(false);
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });

  it("refuse une combinaison de features incompatible (webgl=false + webglIntensity actif)", () => {
    const out = tmpOut("feature-conflict");
    const cfgPath = path.join(tmpdir(), `ace-cli-conflict-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Test" }, design: { webglIntensity: "immersive" }, features: { webgl: false } };\nexport default config;\n`,
    );
    try {
      const res = runCli(["--name", "Test", "--out", out, "--config", cfgPath]);
      expect(res.status).not.toBe(0);
      expect(res.stderr).toMatch(/incompatible/i);
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });
});

describe("ace:new-site CLI — génération réussie (structurelle)", () => {
  it("génère un site avec la configuration minimale valide", () => {
    const out = tmpOut("minimal-ok");
    const cfgPath = path.join(tmpdir(), `ace-cli-minimal-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Minimal" } };\nexport default config;\n`,
    );
    try {
      const res = runCli([
        "--name",
        "Minimal",
        "--out",
        out,
        "--config",
        cfgPath,
        "--skip-install",
        "--skip-check",
      ]);
      expect(res.status).toBe(0);
      expect(existsSync(path.join(out, "package.json"))).toBe(true);
      expect(existsSync(path.join(out, "ace.meta.json"))).toBe(true);
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });

  it("génère un site avec la configuration complète (input/client.config.ts)", () => {
    const out = tmpOut("full-ok");
    const res = runCli(["--name", "Complet", "--out", out, "--skip-install", "--skip-check"]);
    expect(res.status).toBe(0);
    expect(existsSync(path.join(out, "docs/ACE-GENERATION-REPORT.md"))).toBe(true);
  });

  it("injecte l'identité (package.json:name, ace.meta.json, .env.local)", () => {
    const out = tmpOut("identity");
    const res = runCli([
      "--name",
      "Atelier Nord",
      "--slug",
      "atelier-nord",
      "--out",
      out,
      "--skip-install",
      "--skip-check",
    ]);
    expect(res.status).toBe(0);
    const pkg = JSON.parse(readFileSync(path.join(out, "package.json"), "utf8"));
    expect(pkg.name).toBe("atelier-nord");
    const meta = JSON.parse(readFileSync(path.join(out, "ace.meta.json"), "utf8"));
    expect(meta.siteName).toBe("Atelier Nord");
    expect(meta.slug).toBe("atelier-nord");
    const env = readFileSync(path.join(out, ".env.local"), "utf8");
    expect(env).toContain('NEXT_PUBLIC_SITE_NAME="Atelier Nord"');
  });

  it("n'expédie aucune route interne Studio/Lab/Engine", () => {
    const out = tmpOut("no-studio");
    const res = runCli(["--name", "Sans Studio", "--out", out, "--skip-install", "--skip-check"]);
    expect(res.status).toBe(0);
    expect(existsSync(path.join(out, "src/app/lab"))).toBe(false);
    expect(existsSync(path.join(out, "src/app/ace-lab"))).toBe(false);
    expect(existsSync(path.join(out, "src/app/engine"))).toBe(false);
    expect(existsSync(path.join(out, "src/components/lab"))).toBe(false);
    expect(existsSync(path.join(out, "src/components/ace-lab"))).toBe(false);
  });

  it("aucun test conservé dans le site généré n'importe un chemin élagué (Studio/Lab/Engine/générateur)", () => {
    // Régression : un test resté dans le site généré mais important
    // @/app/lab, @/app/ace-lab, @/app/engine, @/components/lab/*,
    // @/components/ace-lab/*, @/components/EngineStatus ou scripts/ace/*
    // casse le typecheck/tests du client — ces chemins n'existent plus une
    // fois le générateur passé. Toute nouvelle recipe/test Studio doit soit
    // rester générique (sans import interne), soit être ajoutée à
    // ENGINE_ONLY_TESTS dans new-site.mjs.
    const out = tmpOut("no-pruned-imports-in-tests");
    const res = runCli([
      "--name",
      "Sans Imports Élagués",
      "--out",
      out,
      "--skip-install",
      "--skip-check",
    ]);
    expect(res.status).toBe(0);

    const forbiddenImportPatterns = [
      /@\/app\/lab(\/|["'`])/,
      /@\/app\/ace-lab(\/|["'`])/,
      /@\/app\/engine(\/|["'`])/,
      /@\/components\/lab\//,
      /@\/components\/ace-lab\//,
      /@\/components\/EngineStatus/,
      /scripts\/ace\//,
    ];

    const walkTestFiles = (dir: string): string[] => {
      const files: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") continue;
          files.push(...walkTestFiles(full));
        } else if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
          files.push(full);
        }
      }
      return files;
    };

    // Les specs e2e conservées ne doivent pas non plus NAVIGUER vers une route
    // interne supprimée (page.goto("/lab")…) — c'est une chaîne, pas un import,
    // donc invisible au typecheck mais un 404 à l'exécution du site client.
    const forbiddenRouteVisits = [
      /goto\(\s*["'`]\/lab(\/|["'`])/,
      /goto\(\s*["'`]\/ace-lab(\/|["'`])/,
      /goto\(\s*["'`]\/engine(\/|["'`])/,
    ];

    const testsDir = path.join(out, "tests");
    const offenders: string[] = [];
    if (existsSync(testsDir)) {
      for (const file of walkTestFiles(testsDir)) {
        const content = readFileSync(file, "utf8");
        for (const pattern of [...forbiddenImportPatterns, ...forbiddenRouteVisits]) {
          if (pattern.test(content)) {
            offenders.push(`${path.relative(out, file)} matches ${pattern}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("conserve les specs universelles (home, reduced-motion) et exclut leurs variantes engine-only", () => {
    const out = tmpOut("universal-specs-kept");
    const res = runCli([
      "--name",
      "Specs Universelles",
      "--out",
      out,
      "--skip-install",
      "--skip-check",
    ]);
    expect(res.status).toBe(0);
    // Universelles conservées :
    expect(existsSync(path.join(out, "tests/e2e/home.spec.ts"))).toBe(true);
    expect(existsSync(path.join(out, "tests/e2e/reduced-motion.spec.ts"))).toBe(true);
    expect(existsSync(path.join(out, "tests/e2e/a11y.spec.ts"))).toBe(true);
    // Variantes engine-only exclues :
    expect(existsSync(path.join(out, "tests/e2e/home-starter.spec.ts"))).toBe(false);
    expect(existsSync(path.join(out, "tests/e2e/reduced-motion-engine.spec.ts"))).toBe(false);
    expect(existsSync(path.join(out, "tests/e2e/a11y-engine-internal.spec.ts"))).toBe(false);
  });

  it("n'expédie aucun document interne du moteur", () => {
    const out = tmpOut("no-internal-docs");
    const res = runCli(["--name", "Sans Docs", "--out", out, "--skip-install", "--skip-check"]);
    expect(res.status).toBe(0);
    expect(existsSync(path.join(out, "docs/audits"))).toBe(false);
    expect(existsSync(path.join(out, "docs/ACE-ROADMAP-FINAL.md"))).toBe(false);
    expect(existsSync(path.join(out, "docs/ACE-GENERATOR.md"))).toBe(false);
  });

  it("copie les assets fournis et produit un manifeste tracé", () => {
    const out = tmpOut("assets");
    const assetsDir = mkdtempSync(path.join(tmpdir(), "ace-cli-assets-"));
    writeFileSync(path.join(assetsDir, "photo.jpg"), "fake-jpeg-bytes");
    try {
      const res = runCli([
        "--name",
        "Avec Assets",
        "--out",
        out,
        "--assets",
        assetsDir,
        "--skip-install",
        "--skip-check",
      ]);
      expect(res.status).toBe(0);
      expect(existsSync(path.join(out, "public/assets/client/photo.jpg"))).toBe(true);
      const manifest = JSON.parse(
        readFileSync(path.join(out, "public/assets/client/MANIFEST.json"), "utf8"),
      );
      expect(manifest.files).toHaveLength(1);
      expect(manifest.files[0]).toMatchObject({ generated: "public/assets/client/photo.jpg" });
      expect(manifest.files[0].sha256).toBeTruthy();
      // Original jamais modifié.
      expect(readFileSync(path.join(assetsDir, "photo.jpg"), "utf8")).toBe("fake-jpeg-bytes");
    } finally {
      rmSync(assetsDir, { recursive: true, force: true });
    }
  });

  it("le contrôle anti-fuite passe et le rapporte dans le rapport de génération", () => {
    const out = tmpOut("anti-leak-report");
    const res = runCli(["--name", "Rapport", "--out", out, "--skip-install", "--skip-check"]);
    expect(res.status).toBe(0);
    const report = readFileSync(path.join(out, "docs/ACE-GENERATION-REPORT.md"), "utf8");
    expect(report).toContain("Contrôle anti-fuite");
    expect(report).toContain("aucun secret détecté");
    expect(report).toContain("Recipes sélectionnées");
    expect(report).toContain("Features résolues");
  });

  it("retire la route de collection quand features.collections est inactif", () => {
    const out = tmpOut("no-collections");
    const res = runCli([
      "--name",
      "Sans Collections",
      "--out",
      out,
      "--skip-install",
      "--skip-check",
    ]);
    expect(res.status).toBe(0);
    expect(existsSync(path.join(out, "src/app/realisations"))).toBe(false);
  });

  it("active le mode proposition privée : noindex global + sitemap vide", () => {
    const out = tmpOut("private-proposal");
    const cfgPath = path.join(tmpdir(), `ace-cli-private-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Prive" }, proposal: { isPrivateProposal: true } };\nexport default config;\n`,
    );
    try {
      const res = runCli([
        "--name",
        "Prive",
        "--out",
        out,
        "--config",
        cfgPath,
        "--skip-install",
        "--skip-check",
      ]);
      expect(res.status).toBe(0);
      const robots = readFileSync(path.join(out, "src/app/robots.ts"), "utf8");
      expect(robots).toContain('disallow: "/"');
      const sitemap = readFileSync(path.join(out, "src/app/sitemap.ts"), "utf8");
      expect(sitemap).toContain("return []");
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });

  it("génère des features résolues cohérentes avec la config (src/config/features.generated.ts)", () => {
    const out = tmpOut("resolved-features");
    const cfgPath = path.join(tmpdir(), `ace-cli-resolved-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Resolved" }, features: { stickyMobileCta: false }, design: { darkMode: false } };\nexport default config;\n`,
    );
    try {
      const res = runCli([
        "--name",
        "Resolved",
        "--out",
        out,
        "--config",
        cfgPath,
        "--skip-install",
        "--skip-check",
      ]);
      expect(res.status).toBe(0);
      const featuresFile = readFileSync(path.join(out, "src/config/features.generated.ts"), "utf8");
      expect(featuresFile).toMatch(/stickyMobileCta:\s*false/);
      expect(featuresFile).toMatch(/darkMode:\s*false/);
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });

  it("src/config/features.generated.ts généré est conforme au style Prettier du dépôt", () => {
    // Régression : JSON.stringify() produit des clés citées sans virgule
    // finale, rejetées par prettier --check du site généré (quality gate).
    const out = tmpOut("features-prettier");
    const res = runCli(["--name", "Prettier", "--out", out, "--skip-install", "--skip-check"]);
    expect(res.status).toBe(0);
    const generated = readFileSync(path.join(out, "src/config/features.generated.ts"), "utf8");
    expect(generated).not.toMatch(/"[a-zA-Z]+":\s/); // clés citées = style JSON.stringify, pas Prettier
    expect(generated).toMatch(/darkMode: (true|false),\n};\n$/); // virgule finale avant l'accolade
  });

  it("câble la home et l'en-tête sur les recipes sélectionnées (rendu config-driven)", () => {
    const out = tmpOut("config-driven");
    const cfgPath = path.join(tmpdir(), `ace-cli-cfgdriven-${Date.now()}.config.ts`);
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Driven" }, recipes: { hero: "media-first", navigation: "immersive-overlay", storytelling: "immersive-scroll", conversion: "premium-inquiry" } };\nexport default config;\n`,
    );
    try {
      const res = runCli([
        "--name",
        "Driven",
        "--out",
        out,
        "--config",
        cfgPath,
        "--skip-install",
        "--skip-check",
      ]);
      expect(res.status).toBe(0);
      // page.tsx délègue à ConfiguredHome.
      const page = readFileSync(path.join(out, "src/app/page.tsx"), "utf8");
      expect(page).toContain("ConfiguredHome");
      // layout.tsx utilise ConfiguredHeader (plus SiteHeader).
      const layout = readFileSync(path.join(out, "src/app/layout.tsx"), "utf8");
      expect(layout).toContain("ConfiguredHeader");
      expect(layout).not.toMatch(/<SiteHeader\s*\/>/);
      // client.resolved.ts reflète la sélection.
      const resolved = readFileSync(path.join(out, "src/config/client.resolved.ts"), "utf8");
      expect(resolved).toMatch(/hero: "media-first"/);
      expect(resolved).toMatch(/navigation: "immersive-overlay"/);
      expect(resolved).toMatch(/storytelling: "immersive-scroll"/);
      // site-content.ts existe.
      expect(existsSync(path.join(out, "src/config/site-content.ts"))).toBe(true);
    } finally {
      rmSync(cfgPath, { force: true });
    }
  });

  it("consomme un content.json fourni via --content", () => {
    const out = tmpOut("content-json");
    const cfgPath = path.join(tmpdir(), `ace-cli-content-${Date.now()}.config.ts`);
    const contentDir = mkdtempSync(path.join(tmpdir(), "ace-cli-contentdir-"));
    writeFileSync(
      cfgPath,
      `import type { ClientConfigInput } from "@/ace/config";\nconst config: ClientConfigInput = { identity: { name: "Contenu" } };\nexport default config;\n`,
    );
    writeFileSync(
      path.join(contentDir, "content.json"),
      JSON.stringify({
        hero: {
          eyebrow: "MARQUEUR-HERO-EYEBROW",
          title: "Titre depuis content.json",
          subtitle: "Sous-titre",
          primaryCta: { label: "Agir", href: "/contact" },
          secondaryCta: { label: "Voir", href: "#story" },
          media: null,
        },
        story: {
          heading: "Récit",
          chapters: [{ eyebrow: "01", title: "Ch1", body: "Corps." }],
        },
        collection: { heading: "Coll", itemLabel: "item", items: [] },
        conversion: {
          title: "Conversion",
          description: "Desc",
          primaryCta: { label: "Agir", href: "/contact" },
        },
        nav: [{ label: "Accueil", href: "/" }],
      }),
    );
    try {
      const res = runCli([
        "--name",
        "Contenu",
        "--out",
        out,
        "--config",
        cfgPath,
        "--content",
        contentDir,
        "--skip-install",
        "--skip-check",
      ]);
      expect(res.status).toBe(0);
      const siteContent = readFileSync(path.join(out, "src/config/site-content.ts"), "utf8");
      expect(siteContent).toContain("Titre depuis content.json");
      expect(siteContent).toContain("MARQUEUR-HERO-EYEBROW");
    } finally {
      rmSync(cfgPath, { force: true });
      rmSync(contentDir, { recursive: true, force: true });
    }
  });
});
