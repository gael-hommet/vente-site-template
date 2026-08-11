/**
 * ace:autopilot — point d'entrée UNIQUE, piloté en langage naturel.
 *
 * Rôle : machine à états persistante + exécution des étapes automatisables +
 * garde-fous. Ce que le script ne peut pas faire (recherche publique, jugement
 * visuel), il le DEMANDE explicitement à l'agent via `NEEDS_AGENT` — il ne
 * l'invente jamais et ne le passe jamais sous silence.
 *
 * Usage (normalement invoqué par Claude, pas par l'utilisateur final) :
 *   pnpm ace:autopilot --brief "Fais un site premium pour ..."   # démarre
 *   pnpm ace:autopilot status                                    # état courant
 *   pnpm ace:autopilot run                                       # avance au max
 *   pnpm ace:autopilot supply --state RESEARCH --file facts.json # apport agent
 *   pnpm ace:autopilot resume                                    # reprise
 *   pnpm ace:autopilot report [--technical]
 *
 * Sorties : 0 = avancé/terminé · 2 = usage · 3 = besoin de l'agent · 4 = bloqué.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  advance,
  beginStep,
  block,
  createMission,
  decideArtDirection,
  decideSpatialStrategy,
  explainSpatialDecision,
  detectIntent,
  endStep,
  assetGate,
  environmentGate,
  factsGate,
  missionSlug,
  qualityGate,
  requiresGeneratedMedia,
  resumeState,
  rightsGate,
  statusLine,
  technicalReport,
  unblock,
  userReport,
  type AutopilotMission,
  type AutopilotState,
  type FactRegistry,
  type SpatialStrategyRecord,
  type StageReport,
} from "@/ace/autopilot";
import {
  hasVisualMaterial,
  productionBlockers,
  bestAssetFor,
  usableAssets,
  validateInventory,
  type AssetInventory,
} from "@/ace/media-engine";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MISSION_DIR = path.join(ROOT, ".ace/missions");

const argv = process.argv.slice(2);
const KNOWN_COMMANDS = ["start", "run", "resume", "supply", "status", "report", "list"] as const;
// La commande est le PREMIER argument, et seulement s'il en est une : sinon le
// texte du brief serait pris pour une commande.
const first = argv[0];
const command =
  first && (KNOWN_COMMANDS as readonly string[]).includes(first)
    ? first
    : argv.includes("--brief")
      ? "start"
      : "status";
const opt = (flag: string): string | undefined => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};
const asJson = argv.includes("--json");

function die(msg: string, code = 2): never {
  console.error(`✗ ${msg}`);
  process.exit(code);
}
const now = (): string => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/* Persistance                                                                */
/* -------------------------------------------------------------------------- */

function missionPath(id: string): string {
  return path.join(MISSION_DIR, `${id}.json`);
}

function saveMission(m: AutopilotMission): void {
  mkdirSync(MISSION_DIR, { recursive: true });
  writeFileSync(missionPath(m.id), JSON.stringify(m, null, 2) + "\n");
  writeFileSync(path.join(MISSION_DIR, "current"), m.id + "\n");
}

function loadMission(id?: string): AutopilotMission | null {
  const pointer = path.join(MISSION_DIR, "current");
  const target = id ?? (existsSync(pointer) ? readFileSync(pointer, "utf8").trim() : null);
  if (!target) return null;
  const file = missionPath(target);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as AutopilotMission;
  } catch {
    return null;
  }
}

function requireMission(): AutopilotMission {
  const m = loadMission(opt("--mission"));
  if (!m) die('aucune mission en cours. Démarrez avec : pnpm ace:autopilot --brief "..."');
  return m;
}

/* -------------------------------------------------------------------------- */
/* Sondes d'environnement                                                     */
/* -------------------------------------------------------------------------- */

interface DoctorReport {
  status: string;
  canBuildSites: boolean;
  canGenerateMedia: boolean;
}

function runDoctor(): DoctorReport {
  const res = spawnSync("node", [path.join(ROOT, "scripts/ace/autopilot/doctor.mjs"), "--json"], {
    encoding: "utf8",
  });
  try {
    return JSON.parse(res.stdout) as DoctorReport;
  } catch {
    return { status: "UNKNOWN", canBuildSites: false, canGenerateMedia: false };
  }
}

/** Exécute une commande du dépôt et renvoie son succès + sa sortie. */
function exec(cmd: string, args: string[], cwd = ROOT): { ok: boolean; out: string } {
  const res = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: !res.error && res.status === 0, out: `${res.stdout ?? ""}${res.stderr ?? ""}` };
}

/* -------------------------------------------------------------------------- */
/* Demande à l'agent                                                          */
/* -------------------------------------------------------------------------- */

/** Ce que l'agent doit fournir pour chaque état qu'un script ne peut pas faire. */
const AGENT_NEEDS: Partial<Record<AutopilotState, string[]>> = {
  RESEARCH: [
    "Rechercher l'entreprise (site, réseaux, annuaires) et collecter des FAITS SOURCÉS.",
    'Écrire un JSON { facts: [{key,value,source,confidence}], notFound: ["..."] }.',
    "Ne RIEN inventer : ce qui est introuvable va dans notFound.",
  ],
  CONTENT: [
    "Rédiger les textes du site à partir des FAITS VÉRIFIÉS de la mission uniquement.",
    "Tout ce qui n'est pas un fait établi reste littéralement « [À CONFIRMER] ».",
    "Aucun avis, prix, promesse, récompense ou chiffre ne doit être inventé.",
    "Écrire un JSON { hero, story, collection, conversion } (voir SiteContentDraft).",
  ],
  ASSET_DISCOVERY: [
    "CHERCHER D'ABORD, ne pas demander : inspecter le site officiel, les réseaux",
    "officiels et les sources publiques vérifiables de l'entreprise.",
    "Collecter logo, photos, vidéos, réalisations, produits, équipe, lieu.",
    'Écrire un JSON { usage: "PRIVATE_DEMO"|"PRODUCTION", assets: AssetRecord[], missing: string[] }',
    "où chaque asset porte : path, source (CLIENT_PROVIDED|OFFICIAL_WEBSITE|OFFICIAL_SOCIAL|",
    "OTHER_VERIFIED_OFFICIAL|USER_SUPPLIED_GENERATED), sourceRef, nature (REAL|CONCEPTUAL),",
    "role, kind, alt, rights. Télécharger les fichiers dans le dossier d'assets de la mission.",
    "ACE NE GÉNÈRE AUCUNE IMAGE : ne demander un visuel à l'utilisateur QUE si la recherche",
    "n'a rien donné.",
  ],
  VISUAL_QA: [
    "Regarder les captures d'écran produites, noter le rendu (0..1) et lister les défauts.",
    "Écrire un JSON { score: number, issues: string[], screenshots: string[] }.",
  ],
};

function emitAgentRequest(m: AutopilotMission, state: AutopilotState): never {
  const needs = [...(AGENT_NEEDS[state] ?? ["Contribution de l'agent requise."])];
  // Nouvelle passe visuelle : on rappelle les défauts à corriger d'abord.
  const last = m.iterations[m.iterations.length - 1];
  if (state === "VISUAL_QA" && last && last.issues.length > 0) {
    needs.unshift(`CORRIGER D'ABORD : ${last.issues.join(" · ")}`);
  }
  const writeTo = path.join(MISSION_DIR, `${m.id}.${state.toLowerCase()}.json`);
  if (asJson) {
    console.log(
      JSON.stringify({ needsAgent: true, state, needs, writeTo, mission: m.id }, null, 2),
    );
  } else {
    console.log(`\nNEEDS_AGENT ${state}`);
    for (const n of needs) console.log(`  • ${n}`);
    console.log(`\n  Déposer le résultat dans : ${writeTo}`);
    console.log(`  Puis : pnpm ace:autopilot supply --state ${state} --file ${writeTo}`);
  }
  process.exit(3);
}

function emitBlocked(m: AutopilotMission): never {
  if (asJson) {
    console.log(
      JSON.stringify(
        { blocked: true, reason: m.blockedReason, message: m.blockedMessage },
        null,
        2,
      ),
    );
  } else {
    console.log("\n" + userReport(m));
  }
  process.exit(4);
}

/* -------------------------------------------------------------------------- */
/* Étapes automatisables                                                      */
/* -------------------------------------------------------------------------- */

/**
 * SITE_BUILD — étape RÉELLE, pas un jalon.
 *
 * 1. génère le projet via `ace:new-site` ;
 * 2. écrit les textes et câble les visuels ;
 * 3. VÉRIFIE ce qui a été produit (pages, nav, CTA, contact, SEO, noindex,
 *    responsive, médias réellement référencés) et rend un rapport d'étape.
 */
function doSiteBuild(m: AutopilotMission): AutopilotMission {
  const outDir = path.resolve(ROOT, "..", m.slug);
  const configPath = path.join(MISSION_DIR, `${m.id}.client.config.ts`);

  const ad =
    m.artDirection ??
    decideArtDirection(m.intent, { hasUsableAssets: m.providedAssets.length > 0 });
  // Un FAIT VÉRIFIÉ prime sur l'extraction faite depuis la phrase de départ.
  const factName = m.facts.facts.find((f) => f.key === "businessName")?.value;
  const name = factName ?? m.intent.businessName ?? m.slug;
  const isDemo = m.intent.deliverable === "demo" || m.usage === "PRIVATE_DEMO";

  // Config client dérivée de la mission — aucun fait inventé : seuls le nom, le
  // secteur et les choix de DESIGN sont écrits. Le contenu reste [À CONFIRMER].
  const config = `import type { ClientConfigInput } from "@/ace/config";

/** Généré par ACE Autopilot depuis le brief utilisateur. Ne pas éditer à la main. */
const config: ClientConfigInput = {
  identity: { name: ${JSON.stringify(name)}, locale: ${JSON.stringify(m.intent.locale)} },
  industry: ${JSON.stringify(m.intent.industry ?? "other")},
  goals: { primaryConversion: ${JSON.stringify(m.intent.primaryConversion ?? "contact")} },
  design: {
    preset: ${JSON.stringify(ad.preset)},
    motionIntensity: ${JSON.stringify(ad.motionIntensity)},
    webglIntensity: ${JSON.stringify(ad.webglIntensity)},
    density: ${JSON.stringify(ad.density)},
  },
  recipes: {
    hero: ${JSON.stringify(ad.recipes.hero)},
    navigation: ${JSON.stringify(ad.recipes.navigation)},
    projects: ${JSON.stringify(ad.recipes.projects)},
    storytelling: ${JSON.stringify(ad.recipes.storytelling)},
    conversion: ${JSON.stringify(ad.recipes.conversion)},
    layout: ${JSON.stringify(ad.recipes.layout)},
  },
  proposal: { isPrivateProposal: ${String(isDemo)} },
};

export default config;
`;
  writeFileSync(configPath, config);

  const args = [
    path.join(ROOT, "scripts/ace/new-site.mjs"),
    "--name",
    name,
    "--slug",
    m.slug,
    "--out",
    outDir,
    "--config",
    configPath,
    "--force",
    "--skip-install",
    "--skip-check",
  ];
  if (m.assetsDir) args.push("--assets", m.assetsDir);
  const res = exec("node", args);
  const cmd = `node scripts/ace/new-site.mjs --name "${name}" --slug ${m.slug} --out ${outDir}`;
  if (!res.ok) {
    const failed = endStep(m, { ok: false, commands: [cmd], notes: [res.out.slice(-600)] }, now());
    return block(failed, "UNRECOVERABLE_ERROR", now(), "La création du projet a échoué.");
  }
  const built: AutopilotMission = { ...m, targetDir: outDir, artDirection: ad };

  // 2) Écriture des textes + câblage des visuels.
  const written = writeSiteContent(built);
  if (!written.ok) {
    const failed = endStep(
      built,
      { ok: false, notes: [written.error ?? "contenu non écrit"] },
      now(),
    );
    return block(failed, "UNRECOVERABLE_ERROR", now(), "Le contenu n'a pas pu être écrit.");
  }

  // 3) Vérifications RÉELLES de ce qui a été produit.
  const has = (rel: string): boolean => existsSync(path.join(outDir, rel));
  const read = (rel: string): string => {
    try {
      return readFileSync(path.join(outDir, rel), "utf8");
    } catch {
      return "";
    }
  };
  const content = read("src/config/site-content.ts");
  const robots = read("src/app/robots.ts");
  const isDemoSite = built.usage === "PRIVATE_DEMO" || isDemo;

  const checks: { label: string; ok: boolean; detail?: string }[] = [
    { label: "page d'accueil", ok: has("src/app/page.tsx") },
    { label: "page contact", ok: has("src/app/contact/page.tsx") },
    { label: "mentions légales", ok: has("src/app/mentions-legales/page.tsx") },
    { label: "contenu éditorial écrit", ok: content.length > 0 },
    { label: "navigation définie", ok: /nav:\s*\[/.test(content) },
    { label: "CTA principal", ok: /primaryCta/.test(content) },
    {
      label: "formulaire de contact",
      ok: has("src/components/conversion") || has("src/app/api/lead"),
    },
    {
      label: "métadonnées SEO",
      ok: has("src/lib/seo/metadata.ts") || /buildMetadata/.test(read("src/app/page.tsx")),
    },
    { label: "sitemap + robots", ok: has("src/app/sitemap.ts") && has("src/app/robots.ts") },
    {
      label: isDemoSite ? "noindex (démo privée)" : "indexation autorisée",
      ok: isDemoSite ? /disallow/i.test(robots) : true,
      detail: isDemoSite ? "robots.ts interdit l'indexation" : undefined,
    },
    {
      label: "visuels réellement référencés",
      ok: built.providedAssets.length === 0 || /\/assets\/client\//.test(content),
      detail: `${String(built.providedAssets.length)} visuel(s) disponible(s)`,
    },
  ];
  const failed = checks.filter((c) => !c.ok);

  const report: StageReport = { stage: "SITE_BUILD", checks, ok: failed.length === 0 };
  const withReport: AutopilotMission = {
    ...built,
    stageReports: [...built.stageReports.filter((r) => r.stage !== "SITE_BUILD"), report],
  };

  return endStep(
    withReport,
    {
      ok: failed.length === 0,
      commands: [cmd],
      notes: [
        `projet créé dans ${outDir}`,
        `contenu écrit : ${written.file}`,
        ...checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label}${c.detail ? ` (${c.detail})` : ""}`),
      ],
    },
    now(),
  );
}

/**
 * MOBILE_QA — étape RÉELLE : une capture mobile est OBLIGATOIRE avant COMPLETE.
 *
 * Démarre le site construit, ouvre un viewport mobile réel (Playwright) et
 * mesure des faits : débordement horizontal, CTA visible, images chargées,
 * taille de police, présence du menu. Aucun de ces points n'est supposé.
 */
function doMobileQa(m: AutopilotMission): AutopilotMission {
  if (!m.targetDir) {
    return block(m, "UNRECOVERABLE_ERROR", now(), "Aucun site à contrôler.");
  }
  const shotDir = path.join(MISSION_DIR, `${m.id}.shots`);
  mkdirSync(shotDir, { recursive: true });

  const res = spawnSync(
    "node",
    [path.join(ROOT, "scripts/ace/autopilot/mobile-qa.mjs"), m.targetDir, shotDir],
    { encoding: "utf8", cwd: ROOT, maxBuffer: 32 * 1024 * 1024 },
  );
  interface MobileQaOutput {
    ok: boolean;
    screenshot: string | null;
    checks: { label: string; ok: boolean; detail?: string }[];
  }
  let parsed: MobileQaOutput | null = null;
  try {
    parsed = JSON.parse(res.stdout) as MobileQaOutput;
  } catch {
    parsed = null;
  }
  if (!parsed) {
    // Sans capture réelle, on ne prétend PAS avoir contrôlé le mobile.
    return endStep(
      m,
      { ok: false, notes: ["capture mobile impossible : contrôle mobile NON effectué"] },
      now(),
    );
  }

  const report: StageReport = { stage: "MOBILE_QA", checks: parsed.checks, ok: parsed.ok };
  const withReport: AutopilotMission = {
    ...m,
    stageReports: [...m.stageReports.filter((r) => r.stage !== "MOBILE_QA"), report],
  };
  return endStep(
    withReport,
    {
      ok: parsed.ok,
      commands: ["capture mobile (Playwright, viewport iPhone)"],
      notes: [
        parsed.screenshot ? `capture : ${parsed.screenshot}` : "capture non enregistrée",
        ...parsed.checks.map(
          (c) => `${c.ok ? "✓" : "✗"} ${c.label}${c.detail ? ` (${c.detail})` : ""}`,
        ),
      ],
    },
    now(),
  );
}

/**
 * CONTENT : écrit les textes de l'agent dans `src/config/site-content.ts` du
 * site généré. Les CTA et la navigation sont dérivés de la configuration, pas
 * inventés ; les items de collection sans lien pointent vers /realisations.
 */
function writeSiteContent(m: AutopilotMission): { ok: boolean; file: string; error?: string } {
  const file = path.join(m.targetDir ?? "", "src/config/site-content.ts");
  if (!m.targetDir || !existsSync(path.dirname(file))) {
    return { ok: false, file, error: "dossier du site introuvable" };
  }
  const c = m.content;
  if (!c) return { ok: false, file, error: "aucun contenu fourni" };

  const ctaLabel =
    m.intent.primaryConversion === "booking"
      ? "Réserver"
      : m.intent.primaryConversion === "quote"
        ? "Demander un devis"
        : "Nous contacter";

  // Les visuels sont câblés PAR RÔLE (hiérarchie de sources respectée) : le
  // logo n'est jamais un fond de hero, et un média conceptuel n'illustre jamais
  // une réalisation. `public/assets/client/<f>` est servi sous `/assets/client/<f>`.
  const inv = m.assetInventory;
  const toUrl = (rec: { path: string }): string => `/assets/client/${path.basename(rec.path)}`;

  let heroMedia: { src: string; alt: string } | null = null;
  let galleryMedia: { src: string; alt: string }[] = [];

  if (inv) {
    const usable = usableAssets(inv).filter((a) => a.kind === "image" && a.role !== "logo");
    const hero = bestAssetFor(inv, "hero") ?? usable[0] ?? null;
    if (hero && hero.role !== "logo") heroMedia = { src: toUrl(hero), alt: hero.alt };
    galleryMedia = usable.filter((a) => a !== hero).map((a) => ({ src: toUrl(a), alt: a.alt }));
  } else {
    // Sans inventaire (assets bruts), on écarte au moins le logo par son nom.
    const files = m.providedAssets.filter(
      (f) => /\.(jpe?g|png|webp|avif)$/i.test(f) && !/logo/i.test(f),
    );
    const first = files[0];
    if (first) {
      heroMedia = {
        src: `/assets/client/${first}`,
        alt: `${m.intent.businessName ?? m.slug} — visuel principal`,
      };
    }
    galleryMedia = files.slice(1).map((f) => ({
      src: `/assets/client/${f}`,
      alt: `${m.intent.businessName ?? m.slug} — visuel`,
    }));
  }

  const data = {
    hero: {
      eyebrow: c.hero.eyebrow,
      title: c.hero.title,
      subtitle: c.hero.subtitle,
      primaryCta: { label: ctaLabel, href: "/contact" },
      secondaryCta: { label: "Découvrir", href: "#story" },
      media: heroMedia,
    },
    story: c.story,
    collection: {
      heading: c.collection.heading,
      intro: c.collection.intro,
      itemLabel: c.collection.itemLabel,
      items: c.collection.items.map((i, idx) => ({
        title: i.title,
        href: "/realisations",
        meta: i.meta,
        // Les visuels restants illustrent la collection, sans jamais réutiliser
        // le hero ni le logo.
        media: galleryMedia[idx] ?? null,
      })),
    },
    conversion: {
      title: c.conversion.title,
      description: c.conversion.description,
      primaryCta: { label: ctaLabel, href: "/contact" },
    },
    nav: [
      { label: "Accueil", href: "/" },
      { label: "Contact", href: "/contact" },
    ],
  };

  const ts = `import type { SiteContent } from "./site-content.types";

/**
 * Contenu éditorial rédigé par ACE Autopilot à partir des faits vérifiés de la
 * mission. Tout marqueur [À CONFIRMER] doit être remplacé par un fait vérifié
 * avant publication.
 */
export const siteContent: SiteContent = ${JSON.stringify(data, null, 2)};
`;
  try {
    writeFileSync(file, ts);
    // Formatage : le site généré a un gate format:check.
    exec("pnpm", ["exec", "prettier", "--write", file]);
    return { ok: true, file };
  } catch (e) {
    return { ok: false, file, error: e instanceof Error ? e.message : String(e) };
  }
}

/** TECHNICAL_QA : lint + typecheck + tests + build DANS le site généré. */
function doTechnicalQa(m: AutopilotMission): AutopilotMission {
  if (!m.targetDir || !existsSync(m.targetDir)) {
    return block(m, "UNRECOVERABLE_ERROR", now(), "Dossier du site introuvable.");
  }
  const commands: string[] = [];
  const notes: string[] = [];

  // Le site généré a besoin de ses dépendances pour être vérifié.
  if (!existsSync(path.join(m.targetDir, "node_modules"))) {
    commands.push("pnpm install --frozen-lockfile");
    const install = exec("pnpm", ["install", "--frozen-lockfile"], m.targetDir);
    if (!install.ok) {
      notes.push("installation des dépendances impossible : vérifications techniques ignorées.");
      return endStep(m, { ok: false, commands, notes }, now());
    }
  }
  for (const step of ["lint", "typecheck", "test", "build"]) {
    commands.push(`pnpm run ${step}`);
    const r = exec("pnpm", ["run", step], m.targetDir);
    if (!r.ok) {
      notes.push(`échec : ${step}`);
      return endStep(m, { ok: false, commands, notes: [...notes, r.out.slice(-800)] }, now());
    }
    notes.push(`${step} ✓`);
  }
  return endStep(m, { ok: true, commands, notes }, now());
}

/* -------------------------------------------------------------------------- */
/* Boucle principale                                                          */
/* -------------------------------------------------------------------------- */

function runLoop(startMission: AutopilotMission): AutopilotMission {
  let m = startMission;
  // Borne dure : 24 transitions max par invocation (anti-boucle).
  for (let guard = 0; guard < 24; guard += 1) {
    if (m.state === "COMPLETE" || m.state === "BLOCKED") break;

    m = beginStep(m, m.state, now());

    switch (m.state) {
      case "INTAKE": {
        const env = environmentGate(runDoctor());
        if (!env.pass) {
          m = endStep(m, { ok: false, notes: [env.message] }, now());
          m = block(m, "ENVIRONMENT_NOT_READY", now());
          break;
        }
        if (!m.intent.isSiteMission) {
          m = endStep(m, { ok: false, notes: ["la demande n'est pas une mission de site"] }, now());
          m = block(
            m,
            "MISSING_ESSENTIAL_INFO",
            now(),
            "La demande ne décrit pas un site à créer.",
          );
          break;
        }
        m = endStep(
          m,
          { ok: true, notes: [`intention détectée (confiance ${String(m.intent.confidence)})`] },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "RESEARCH": {
        if (m.facts.facts.length === 0) {
          m = endStep(m, { ok: false, notes: ["recherche déléguée à l'agent"] }, now());
          saveMission(m);
          emitAgentRequest(m, "RESEARCH");
        }
        m = endStep(
          m,
          { ok: true, notes: [`${String(m.facts.facts.length)} fait(s) collecté(s)`] },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "FACT_CHECK": {
        const gate = factsGate(m.facts);
        if (!gate.pass) {
          m = endStep(m, { ok: false, notes: [gate.detail ?? gate.message] }, now());
          m = block(m, "MISSING_ESSENTIAL_INFO", now(), gate.message);
          break;
        }
        m = endStep(
          m,
          { ok: true, notes: [`${String(m.facts.notFound.length)} champ(s) [À CONFIRMER]`] },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "ASSET_DISCOVERY": {
        // CHERCHER D'ABORD : c'est l'agent qui inspecte les sources officielles.
        if (!m.assetInventory) {
          m = endStep(m, { ok: false, notes: ["recherche des visuels déléguée à l'agent"] }, now());
          saveMission(m);
          emitAgentRequest(m, "ASSET_DISCOVERY");
        }
        const inv = m.assetInventory;
        m = endStep(
          m,
          {
            ok: true,
            notes: [
              `${String(inv.assets.length)} média(s) inventorié(s)`,
              inv.missing.length > 0
                ? `introuvables : ${inv.missing.join(", ")}`
                : "rien d'introuvable",
            ],
          },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "ASSET_VALIDATION": {
        const inv = m.assetInventory as AssetInventory;
        const issues = validateInventory(inv);
        const errors = issues.filter((i) => i.severity === "error");
        const usable = usableAssets(inv);
        // Les fichiers réellement exploitables alimentent le site.
        m = {
          ...m,
          providedAssets: usable.map((a) => path.basename(a.path)),
          usage: inv.usage,
        };
        // En production, un droit non confirmé bloque.
        const rights = rightsGate({ usage: inv.usage, unconfirmed: productionBlockers(inv) });
        if (!rights.pass) {
          m = endStep(m, { ok: false, notes: [rights.detail ?? rights.message] }, now());
          m = block(m, "MEDIA_RIGHTS_UNCONFIRMED", now(), rights.message);
          break;
        }
        m = endStep(
          m,
          {
            ok: true,
            notes: [
              `${String(usable.length)} média(s) utilisable(s)`,
              ...errors.map((e) => `écarté : ${e.path} — ${e.message}`),
            ],
          },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "ART_DIRECTION": {
        // La DA est décidée APRÈS avoir vu le matériau réel.
        const inv = m.assetInventory;
        const material = inv ? hasVisualMaterial(inv) : m.providedAssets.length > 0;
        const ad = m.artDirection ?? decideArtDirection(m.intent, { hasUsableAssets: material });
        const gate = assetGate({
          imageLedDirection: requiresGeneratedMedia(ad, { hasUsableAssets: material }),
          hasVisualMaterial: material,
        });
        if (!gate.pass) {
          m = endStep(m, { ok: false, notes: [gate.detail ?? gate.message] }, now());
          m = block(m, "MEDIA_ASSET_REQUIRED", now(), gate.message);
          break;
        }
        // ACE 0.3 — la stratégie SPATIALE se décide ici, en regardant le
        // matériau réel. L'utilisateur n'a répondu à aucune question technique :
        // c'est le nombre de vraies photos et la présence de cartes de
        // profondeur qui déterminent le mode.
        const spatialDecision = inv ? decideSpatialStrategy(inv) : null;
        const spatial: SpatialStrategyRecord | null = spatialDecision
          ? {
              // `null` = aucune expérience spatiale possible : on le nomme.
              mode: spatialDecision.mode ?? "none",
              explanation: explainSpatialDecision(spatialDecision),
              images: spatialDecision.images,
              missing: spatialDecision.missing,
            }
          : null;
        m = { ...m, artDirection: ad, spatial };
        m = endStep(
          m,
          {
            ok: true,
            notes: [
              `concept : ${ad.concept}`,
              ad.rationale,
              ...(spatial ? [`spatial : ${spatial.mode} — ${spatial.explanation}`] : []),
              ...(spatial?.missing ?? []),
            ],
          },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "CONTENT": {
        if (!m.content) {
          m = endStep(m, { ok: false, notes: ["rédaction déléguée à l'agent"] }, now());
          saveMission(m);
          emitAgentRequest(m, "CONTENT");
        }
        m = endStep(m, { ok: true, notes: ["textes fournis par l'agent"] }, now());
        m = advance(m, now());
        break;
      }

      case "MEDIA_PLAN": {
        const inv = m.assetInventory;
        const material = inv ? hasVisualMaterial(inv) : false;
        m = endStep(
          m,
          {
            ok: true,
            notes: [
              material
                ? `habillage porté par ${String(m.providedAssets.length)} visuel(s) réel(s)`
                : "aucun visuel : parti-pris éditorial assumé",
              "aucune génération d'image : coût média 0 €",
            ],
          },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "MEDIA_PROCESSING": {
        // Optimisation RÉELLE des médias importés (sharp/ffmpeg via le pipeline).
        if (!m.assetsDir || m.providedAssets.length === 0) {
          m = endStep(m, { ok: true, notes: ["aucun média à optimiser"] }, now());
          m = advance(m, now());
          break;
        }
        const r = exec("pnpm", ["run", "assets:images"], ROOT);
        m = endStep(
          m,
          {
            ok: true,
            commands: ["pnpm run assets:images"],
            notes: [r.ok ? "images optimisées" : "optimisation ignorée (pipeline indisponible)"],
          },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "SITE_BUILD": {
        m = doSiteBuild(m);
        if (m.state === "BLOCKED") break;
        m = advance(m, now());
        break;
      }

      case "VISUAL_QA": {
        if (m.iterations.length === 0) {
          m = endStep(m, { ok: false, notes: ["revue visuelle déléguée à l'agent"] }, now());
          saveMission(m);
          emitAgentRequest(m, "VISUAL_QA");
        }
        const last = m.iterations[m.iterations.length - 1];
        const quality = qualityGate({
          score: last?.score ?? null,
          iterationsDone: m.iterations.length,
        });
        if (!quality.pass) {
          m = endStep(m, { ok: false, notes: [quality.detail ?? quality.message] }, now());
          if (quality.reason === "QUALITY_NOT_REACHED") {
            m = block(m, "QUALITY_NOT_REACHED", now());
            break;
          }
          saveMission(m);
          emitAgentRequest(m, "VISUAL_QA");
        }
        m = endStep(
          m,
          { ok: true, notes: [`score ${String(last?.score ?? "non évalué")} — validé`] },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "MOBILE_QA": {
        m = doMobileQa(m);
        if (m.state === "BLOCKED") break;
        // Une capture mobile réelle est OBLIGATOIRE, et ses constats aussi :
        // un site qui échoue au mobile n'est pas terminé.
        const mobile = m.stageReports.find((r) => r.stage === "MOBILE_QA");
        if (!mobile || !mobile.ok) {
          const failing = (mobile?.checks ?? [])
            .filter((c) => !c.ok)
            .map((c) => `${c.label}${c.detail ? ` (${c.detail})` : ""}`);
          m = block(
            m,
            "QUALITY_NOT_REACHED",
            now(),
            failing.length > 0
              ? `Sur mobile : ${failing.join(" · ")}.`
              : "Le contrôle mobile n'a pas pu être effectué.",
          );
          break;
        }
        m = advance(m, now());
        break;
      }

      case "TECHNICAL_QA": {
        m = doTechnicalQa(m);
        if (m.state === "BLOCKED") break;
        if (m.steps[m.steps.length - 1]?.ok === false) {
          m = block(m, "UNRECOVERABLE_ERROR", now(), "Les vérifications techniques ont échoué.");
          break;
        }
        m = advance(m, now());
        break;
      }

      case "PREVIEW": {
        const port = Number(opt("--port") ?? "3000");
        const url = `http://localhost:${String(port)}`;
        const probe = spawnSync("curl", ["-s", "-o", "/dev/null", "-m", "2", url]);
        const live = !probe.error && probe.status === 0;
        m = endStep(
          m,
          {
            ok: true,
            commands: [`(dans ${m.targetDir ?? "?"}) pnpm dev`],
            notes: [
              live
                ? `preview active : ${url}`
                : `preview à démarrer : pnpm dev dans ${m.targetDir ?? "?"}`,
            ],
          },
          now(),
        );
        m = { ...m, previewUrl: live ? url : null };
        m = advance(m, now());
        break;
      }

      default:
        m = endStep(m, { ok: true, notes: ["état sans action"] }, now());
        m = advance(m, now());
        break;
    }
    saveMission(m);
  }
  return m;
}

/* -------------------------------------------------------------------------- */
/* Commandes                                                                  */
/* -------------------------------------------------------------------------- */

switch (command) {
  case "start": {
    const brief = opt("--brief");
    if (!brief) die('argument requis : --brief "votre demande"');
    const intent = detectIntent(brief);
    const slug = missionSlug(intent);
    const id = `${slug}-${Date.now().toString(36)}`;
    let m = createMission({ id, brief, intent, slug, now: now() });
    // Assets fournis : leur simple présence supprime le besoin de génération IA.
    const assetsDir = opt("--assets");
    if (assetsDir) {
      if (!existsSync(assetsDir)) die(`dossier d'assets introuvable : ${assetsDir}`);
      const found = readdirSync(assetsDir).filter((f) => !f.startsWith("."));
      m = { ...m, assetsDir, providedAssets: found };
    }
    saveMission(m);
    if (!asJson) {
      console.log(`\n  Mission créée : ${slug}`);
      console.log(`  ${statusLine(m)}`);
    }
    m = runLoop(m);
    if (m.state === "BLOCKED") emitBlocked(m);
    console.log("\n" + userReport(m));
    break;
  }

  case "run":
  case "resume": {
    let m = requireMission();
    if (command === "resume") {
      const at = resumeState(m);
      m = unblock(m, at, now());
      if (!asJson) console.log(`\n  Reprise de « ${m.slug} » à l'étape ${at}.`);
    }
    m = runLoop(m);
    saveMission(m);
    if (m.state === "BLOCKED") emitBlocked(m);
    console.log("\n" + userReport(m));
    break;
  }

  case "supply": {
    const m = requireMission();
    const state = (opt("--state") ?? "").toUpperCase() as AutopilotState;
    const file = opt("--file");
    if (!file || !existsSync(file)) die("argument requis : --file <resultat.json>");
    let payload: unknown;
    try {
      payload = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      die(`fichier illisible : ${e instanceof Error ? e.message : String(e)}`);
    }

    let updated: AutopilotMission = m;
    if (state === "RESEARCH") {
      const p = payload as Partial<FactRegistry>;
      const facts = Array.isArray(p.facts) ? p.facts : [];
      // Un fait sans source est refusé : c'est la garantie « rien d'inventé ».
      const unsourced = facts.filter((f) => !f.source || !f.source.trim());
      if (unsourced.length > 0) {
        die(
          `${String(unsourced.length)} fait(s) sans source — refusé. Chaque fait doit être sourcé.`,
          2,
        );
      }
      updated = { ...m, facts: { facts, notFound: p.notFound ?? [] }, updatedAt: now() };
    } else if (state === "ASSET_DISCOVERY") {
      const inv = payload as AssetInventory;
      // Provenance obligatoire : un média sans source est refusé (rien d'inventé).
      const bad = (inv.assets ?? []).filter(
        (a) => a.source !== "EDITORIAL_FALLBACK" && !a.sourceRef?.trim(),
      );
      if (bad.length > 0) {
        die(
          `${String(bad.length)} média(s) sans provenance — refusé. Chaque visuel doit être sourcé.`,
          2,
        );
      }
      updated = { ...m, assetInventory: inv, usage: inv.usage ?? m.usage, updatedAt: now() };
    } else if (state === "CONTENT") {
      updated = { ...m, content: payload as AutopilotMission["content"], updatedAt: now() };
    } else if (state === "VISUAL_QA") {
      const p = payload as { score?: number; issues?: string[]; screenshots?: string[] };
      updated = {
        ...m,
        iterations: [
          ...m.iterations,
          {
            round: m.iterations.length + 1,
            score: typeof p.score === "number" ? p.score : null,
            screenshots: p.screenshots ?? [],
            issues: p.issues ?? [],
            fixed: [],
          },
        ],
        updatedAt: now(),
      };
    } else {
      die(`état non pris en charge pour --supply : ${state}`);
    }
    saveMission(updated);
    const after = runLoop(updated);
    saveMission(after);
    if (after.state === "BLOCKED") emitBlocked(after);
    console.log("\n" + userReport(after));
    break;
  }

  case "status": {
    const m = loadMission(opt("--mission"));
    if (!m) {
      console.log("  Aucune mission en cours.");
      process.exit(0);
    }
    if (asJson) console.log(JSON.stringify(m, null, 2));
    else {
      console.log(`\n  ${statusLine(m)}`);
      console.log("\n" + userReport(m));
    }
    break;
  }

  case "report": {
    const m = requireMission();
    console.log(argv.includes("--technical") ? technicalReport(m) : userReport(m));
    break;
  }

  case "list": {
    if (!existsSync(MISSION_DIR)) {
      console.log("  Aucune mission.");
      break;
    }
    const files = readdirSync(MISSION_DIR).filter((f) => f.endsWith(".json") && !f.includes("."));
    for (const f of files) console.log(`  ${f.replace(/\.json$/, "")}`);
    break;
  }

  default:
    die(
      `commande inconnue : ${command}\n` +
        '  usage : --brief "..." | run | resume | supply | status | report | list',
    );
}
