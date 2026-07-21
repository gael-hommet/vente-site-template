#!/usr/bin/env node
/**
 * ace:new-site — générateur industriel : produit un dépôt client à partir de
 * ce moteur, piloté par une configuration client TypeScript, un brief et des
 * assets.
 *
 *   pnpm ace:new-site \
 *     --name "Nom du client" --slug nom-client \
 *     --brief input/CLIENT_BRIEF.md --config input/client.config.ts \
 *     --assets input/assets --out /workspaces/nom-client
 *
 * Garanties :
 * - export via `git archive HEAD` : uniquement les fichiers suivis (aucun
 *   secret local, aucun cache, aucun fichier non commité ne peut fuiter) ;
 * - la configuration client (Zod, `src/ace/config`) est LA source de vérité —
 *   ce script ne duplique jamais le schéma, il délègue à
 *   `scripts/ace/load-client-config.ts` (exécuté via `tsx`) ;
 * - une recipe, une feature ou une config invalide bloque la génération AVANT
 *   toute écriture sur disque de sortie ;
 * - Studio/Lab/Engine (routes internes) sont physiquement absents du site
 *   généré — pas seulement noindex ;
 * - contrôle anti-fuite (secrets, identité étrangère, fichiers interdits) ;
 * - `docs/ACE-GENERATION-REPORT.md` produit dans le site généré.
 */

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/* -------------------------------------------------------------------------- */
/* CLI args                                                                    */
/* -------------------------------------------------------------------------- */
const args = process.argv.slice(2);
const opt = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(name);

if (flag("--help") || flag("-h")) {
  console.log(`
ace:new-site — génère un dépôt client à partir du moteur ACE.

Usage :
  pnpm ace:new-site --name "Nom du client" --slug nom-client \\
    --brief input/CLIENT_BRIEF.md --config input/client.config.ts \\
    --assets input/assets --out ../nom-client [--url https://…]

Arguments :
  --name <texte>      requis. Nom affiché du client.
  --slug <slug>        optionnel. Slug kebab-case (dérivé de --name sinon).
  --brief <chemin>      optionnel. Brief Markdown copié tel quel dans le site.
  --config <chemin>     optionnel. Configuration client TS (défaut :
                         input/client.config.ts si présent).
  --assets <dossier>    optionnel. Dossier d'assets à copier + inventorier.
  --content <dossier>   optionnel. Dossier contenant content.json (contenu
                         éditorial). Défaut : <dossier du config>/content.
  --out <chemin>        requis. Dossier cible (doit être vide ou absent).
  --url <origine>       optionnel. Origine absolue (canonical/OG/sitemap).
  --force                écrase un dossier de sortie non vide.
  --skip-install         n'exécute pas \`pnpm install\` dans le site généré.
  --skip-check           n'exécute pas les quality gates (lint/typecheck/tests/build).

Codes de sortie : 0 = succès, 1 = échec (config/args/fuite/quality gate).
`);
  process.exit(0);
}

const name = opt("--name");
const out = opt("--out");
const slugArg = opt("--slug");
const briefArg = opt("--brief");
const configArg = opt("--config") ?? "input/client.config.ts";
const assetsArg = opt("--assets");
const contentArg = opt("--content");
const url = opt("--url");
const force = flag("--force");
const skipInstall = flag("--skip-install");
const skipCheck = flag("--skip-check");

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!name) die('argument requis : --name "Nom du site"');
if (!out) die("argument requis : --out <dossier-cible>");

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const slug = slugArg ? slugify(slugArg) : slugify(name);
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  die(`slug invalide dérivé de "${slugArg ?? name}" : "${slug}" (attendu : [a-z][a-z0-9-]*)`);
}

const target = path.resolve(process.cwd(), out);
if (existsSync(target) && readdirSync(target).length > 0 && !force) {
  die(`le dossier cible existe et n'est pas vide : ${target} (utiliser --force pour écraser)`);
}

const configPath = path.resolve(process.cwd(), configArg);
if (!existsSync(configPath)) {
  die(`fichier de configuration introuvable : ${configPath} (--config)`);
}

const briefPath = briefArg
  ? path.resolve(process.cwd(), briefArg)
  : path.join(ROOT, "input/CLIENT_BRIEF.md");
if (!existsSync(briefPath)) {
  die(`brief introuvable : ${briefPath} (--brief)`);
}

if (contentArg && !existsSync(path.resolve(process.cwd(), contentArg))) {
  die(`dossier de contenu introuvable : ${path.resolve(process.cwd(), contentArg)} (--content)`);
}

const assetsPath = assetsArg ? path.resolve(process.cwd(), assetsArg) : null;
if (assetsArg && !existsSync(assetsPath)) {
  die(`dossier d'assets introuvable : ${assetsPath} (--assets)`);
}

/* -------------------------------------------------------------------------- */
/* A. Chargement + validation de la configuration client (délégué au moteur)  */
/* -------------------------------------------------------------------------- */
console.log(
  `▸ chargement de la configuration client : ${path.relative(process.cwd(), configPath)}`,
);
let loadResult;
try {
  const stdout = execFileSync(
    "pnpm",
    ["exec", "tsx", "scripts/ace/load-client-config.ts", configPath],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  loadResult = JSON.parse(stdout);
} catch (e) {
  const stderr = e.stderr?.toString?.() ?? "";
  let issues = [String(e.message ?? e)];
  try {
    const parsed = JSON.parse(stderr.trim().split("\n").pop());
    if (parsed.issues) issues = parsed.issues;
  } catch {
    // stderr wasn't JSON — keep the raw message.
  }
  console.error("✗ Configuration client invalide :");
  for (const i of issues) console.error("  -", i);
  process.exit(1);
}
if (!loadResult.ok) {
  console.error("✗ Configuration client invalide :");
  for (const i of loadResult.issues) console.error("  -", i);
  process.exit(1);
}
const { config: clientConfig, features: resolvedFeatures } = loadResult;
console.log(
  `✓ configuration valide — recipes: ${Object.entries(clientConfig.recipes)
    .map(([k, v]) => `${k}=${v ?? "—"}`)
    .join(", ")}`,
);

/* -------------------------------------------------------------------------- */
/* Identité moteur                                                            */
/* -------------------------------------------------------------------------- */
const versionSource = readFileSync(path.join(ROOT, "src/ace/core/version.ts"), "utf8");
const aceVersion = versionSource.match(/ACE_VERSION = "([^"]+)"/)?.[1] ?? "0.0.0";
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();

console.log(
  `▸ ACE v${aceVersion} (${commit.slice(0, 7)}) → "${name}" [${clientConfig.design.preset}]`,
);

/* -------------------------------------------------------------------------- */
/* Export tracked files only (git archive → tar → extract)                    */
/* -------------------------------------------------------------------------- */
const staging = mkdtempSync(path.join(tmpdir(), "ace-new-site-"));
const tarPath = path.join(staging, "site.tar");
execFileSync("git", ["archive", "--format=tar", "-o", tarPath, "HEAD"], { cwd: ROOT });
const extracted = path.join(staging, "site");
mkdirSync(extracted, { recursive: true });
execFileSync("tar", ["-xf", tarPath, "-C", extracted]);
console.log("✓ export des fichiers trackés (git archive)");

/* -------------------------------------------------------------------------- */
/* D. Exclusion Studio/Lab/Engine + documents internes du moteur              */
/* -------------------------------------------------------------------------- */
const ENGINE_ONLY_DOCS = [
  "docs/audits",
  "docs/captures",
  "docs/IMPLEMENTATION-PLAN.md",
  "docs/ACE-ARCHITECTURE-DECISION.md",
  "docs/ACE-GENERATOR.md",
  "docs/ACE-GENERATION-CONTRACT.md",
  "docs/ACE-GENERATOR-QUALITY-GATES.md",
  "docs/REINTEGRATION-AUDIT.md",
  "docs/RECOVERY-STATUS.md",
  "docs/ACE-PILOT-LEARNINGS.md",
  "docs/ACE-BACKPORT-PLAN.md",
  "docs/ACE-ROADMAP-FINAL.md",
  "docs/ACE-ANTI-TEMPLATE-VALIDATION.md",
  "docs/ACE-FINAL-REPORT.md",
];
// Routes Studio/Lab/Engine : jamais expédiées à un client — absence PHYSIQUE,
// pas seulement noindex (preuve automatisée en test).
const STUDIO_ROUTES = ["src/app/lab", "src/app/ace-lab", "src/app/engine"];
const STUDIO_COMPONENT_DIRS = ["src/components/lab", "src/components/ace-lab"];
const STUDIO_ONLY_COMPONENTS = ["src/components/EngineStatus.tsx"];
// Tests unitaires/e2e qui n'ont de sens que sur les routes internes ci-dessus
// (sinon : imports cassés → typecheck/build rouges dans le site généré).
const ENGINE_ONLY_TESTS = [
  "tests/unit/engine-internal.test.tsx",
  "tests/unit/recipe-matrix.test.tsx",
  // home-content teste la home STARTER du moteur (« Votre promesse », preuve,
  // offre, FAQ). Un site généré remplace page.tsx par ConfiguredHome → ce test
  // n'a plus de sens côté client (configured-home.test.tsx le remplace).
  "tests/unit/home-content.test.tsx",
  "tests/e2e/lab.spec.ts",
  "tests/e2e/ace-lab.spec.ts",
  "tests/e2e/a11y-engine-internal.spec.ts",
  // home-starter teste la home STARTER + les pages de démo /offre-/realisations
  // et /engine — remplacées/absentes dans un site client (home.spec.ts couvre
  // l'universel).
  "tests/e2e/home-starter.spec.ts",
  // reduced-motion-engine visite /lab (route interne) — absente d'un site
  // client. Le volet universel (/ sous reduced-motion) reste dans
  // reduced-motion.spec.ts (conservé côté client).
  "tests/e2e/reduced-motion-engine.spec.ts",
  // forms-engine teste le LeadForm riche de /lab (route interne). Le volet
  // universel (ContactForm sur /contact) reste dans forms.spec.ts.
  "tests/e2e/forms-engine.spec.ts",
];
// Le générateur lui-même : un site client ne régénère jamais de site depuis
// lui-même (et `git archive HEAD` y échouerait de toute façon, le site
// généré n'étant pas encore un dépôt git à l'étape "next steps").
const GENERATOR_TOOLING = ["scripts/ace", "tests/unit/ace-generator-cli.test.ts"];
// Fixtures internes de validation + comparaison anti-template : contiennent
// l'identité d'AUTRES fixtures (éditoriale/immersive) et ne doivent jamais
// partir dans un site client.
const ENGINE_ONLY_FIXTURES = [
  "validation-inputs",
  "docs/anti-template",
  "scripts/ace/compare-creative-fingerprints.mjs",
  "tests/unit/anti-template.test.ts",
];

const pruned = [
  ...ENGINE_ONLY_DOCS,
  ...STUDIO_ROUTES,
  ...STUDIO_COMPONENT_DIRS,
  ...STUDIO_ONLY_COMPONENTS,
  ...ENGINE_ONLY_TESTS,
  ...GENERATOR_TOOLING,
  ...ENGINE_ONLY_FIXTURES,
];
for (const rel of pruned) {
  rmSync(path.join(extracted, rel), { recursive: true, force: true });
}
console.log(`✓ Studio/Lab/Engine + documents internes exclus (${pruned.length} entrées élaguées)`);

/* -------------------------------------------------------------------------- */
/* B/D. Copie du contrat d'entrée (brief + config) dans le site généré        */
/* -------------------------------------------------------------------------- */
mkdirSync(path.join(extracted, "input"), { recursive: true });
cpSync(briefPath, path.join(extracted, "input/CLIENT_BRIEF.md"));
cpSync(configPath, path.join(extracted, "input/client.config.ts"));
console.log("✓ brief + configuration client copiés dans input/");

/* -------------------------------------------------------------------------- */
/* H. Assets — copie + manifeste (traçabilité, pas de collision, pas d'écrasement des sources) */
/* -------------------------------------------------------------------------- */
const DANGEROUS_EXT = new Set([".exe", ".dll", ".sh", ".bat", ".cmd", ".ps1", ".app", ".msi"]);
const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".svg",
  ".tiff",
  ".gif",
  ".mp4",
  ".mov",
  ".webm",
  ".m4v",
  ".glb",
  ".gltf",
  ".ktx2",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".pdf",
]);

function sha256(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

function walkFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else {
      out.push({ abs: full, rel: path.relative(base, full) });
    }
  }
  return out;
}

const assetManifest = [];
const assetProblems = [];
if (assetsPath) {
  const files = walkFiles(assetsPath).filter((f) => path.basename(f.rel) !== ".gitkeep");
  const destRoot = path.join(extracted, "public/assets/client");
  mkdirSync(destRoot, { recursive: true });
  const seenDestPaths = new Set();
  for (const f of files) {
    const extName = path.extname(f.rel).toLowerCase();
    if (DANGEROUS_EXT.has(extName)) {
      assetProblems.push(`format interdit refusé : ${f.rel}`);
      continue;
    }
    if (!ALLOWED_EXT.has(extName)) {
      assetProblems.push(`format inattendu signalé (copié quand même) : ${f.rel}`);
    }
    const destRel = f.rel.replace(/\\/g, "/");
    if (seenDestPaths.has(destRel)) {
      assetProblems.push(`collision de chemin généré : ${destRel}`);
      continue;
    }
    seenDestPaths.add(destRel);
    const destAbs = path.join(destRoot, destRel);
    mkdirSync(path.dirname(destAbs), { recursive: true });
    cpSync(f.abs, destAbs); // originaux jamais modifiés (source input/assets intacte)
    assetManifest.push({
      source: path.relative(process.cwd(), f.abs),
      generated: `public/assets/client/${destRel}`,
      ext: extName,
      bytes: statSync(f.abs).size,
      sha256: sha256(f.abs),
    });
  }
  if (assetProblems.length > 0) {
    console.log(`⚠ assets : ${assetProblems.length} signalement(s) :`);
    for (const p of assetProblems) console.log("  -", p);
  }
  console.log(`✓ assets copiés : ${assetManifest.length} fichier(s) (originaux non modifiés)`);
} else {
  console.log("… aucun dossier --assets fourni : étape ignorée");
}

mkdirSync(path.join(extracted, "public/assets/client"), { recursive: true });
writeFileSync(
  path.join(extracted, "public/assets/client/MANIFEST.json"),
  JSON.stringify({ generatedAt: null, files: assetManifest }, null, 2) + "\n",
);

/* -------------------------------------------------------------------------- */
/* D/E/F/G. Identité, Design Language, features résolues, recipes, proposal   */
/* -------------------------------------------------------------------------- */

// Identité runtime (déjà lue par src/config/site.ts via env — pas de secret).
const envLines = [
  "# Généré par ace:new-site — identité runtime du site (aucun secret ici).",
  `NEXT_PUBLIC_SITE_NAME="${name}"`,
  `NEXT_PUBLIC_ACE_PRESET="${clientConfig.design.preset}"`,
];
if (url) envLines.push(`NEXT_PUBLIC_SITE_URL="${url}"`);
writeFileSync(path.join(extracted, ".env.local"), envLines.join("\n") + "\n");

// Features résolues (src/config/features.generated.ts) — chaque flag a un
// effet réel : StickyMobileCTA, ThemeToggle, etc. les consomment déjà.
// Émis comme littéral TS valide (clés non-citées, virgule finale) pour rester
// conforme au style Prettier du dépôt sans dépendre de prettier à l'exécution.
const featuresObjectLiteral =
  "{\n" +
  Object.entries(resolvedFeatures)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
    .join("\n") +
  "\n}";
const featuresTs = `import type { ResolvedFeatures } from "@/ace/config";

/**
 * Feature flags résolus, générés par \`pnpm ace:new-site\` à partir du contrat
 * client (${path.basename(configArg)}). Réécrit à chaque génération — ne pas
 * éditer à la main.
 */
export const resolvedFeatures: ResolvedFeatures = ${featuresObjectLiteral};
`;
writeFileSync(path.join(extracted, "src/config/features.generated.ts"), featuresTs);

// Configuration client résolue committée (JSON), consommable par le site
// généré (routes/collections/recipes) sans réimporter Zod côté client.
mkdirSync(path.join(extracted, "src/config"), { recursive: true });
writeFileSync(
  path.join(extracted, "src/config/client.resolved.json"),
  JSON.stringify(clientConfig, null, 2) + "\n",
);

/* -------------------------------------------------------------------------- */
/* Sélection de recipes résolue (src/config/client.resolved.ts) — pilote la    */
/* home config-driven (ConfiguredHome) et l'en-tête (ConfiguredHeader).        */
/* -------------------------------------------------------------------------- */
const resolvedSelection = {
  hero: clientConfig.recipes.hero ?? "typographic",
  navigation: clientConfig.recipes.navigation ?? "minimal-header",
  projects: clientConfig.recipes.projects ?? "visual-grid",
  storytelling: clientConfig.recipes.storytelling ?? "linear-sections",
  conversion: clientConfig.recipes.conversion ?? "minimal-contact",
  layout: clientConfig.recipes.layout ?? "editorial-layout",
};
const resolvedClientTs = `/**
 * Sélection de recipes + Design Language RÉSOLUS — générés par ace:new-site
 * depuis ${path.basename(configArg)}. Réécrit à chaque génération ; ne pas
 * éditer à la main. Consommé par ConfiguredHome/ConfiguredHeader.
 */
import type { ResolvedClientMeta } from "./client.resolved.types";

export const resolvedClient: ResolvedClientMeta = {
  recipes: {
    hero: ${JSON.stringify(resolvedSelection.hero)},
    navigation: ${JSON.stringify(resolvedSelection.navigation)},
    projects: ${JSON.stringify(resolvedSelection.projects)},
    storytelling: ${JSON.stringify(resolvedSelection.storytelling)},
    conversion: ${JSON.stringify(resolvedSelection.conversion)},
    layout: ${JSON.stringify(resolvedSelection.layout)},
  },
  motionIntensity: ${JSON.stringify(clientConfig.design.motionIntensity)},
  webglIntensity: ${JSON.stringify(clientConfig.design.webglIntensity)},
  density: ${JSON.stringify(clientConfig.design.density)},
};
`;
writeFileSync(path.join(extracted, "src/config/client.resolved.ts"), resolvedClientTs);

/* -------------------------------------------------------------------------- */
/* Contenu éditorial (src/config/site-content.ts). Source : --content/content  */
/* .json si fourni, sinon un contenu neutre dérivé de l'identité + du contrat.  */
/* -------------------------------------------------------------------------- */
const contentDir = contentArg
  ? path.resolve(process.cwd(), contentArg)
  : path.join(path.dirname(configPath), "content");
let siteContentData = null;
const contentJsonPath = path.join(contentDir, "content.json");
if (existsSync(contentJsonPath)) {
  try {
    siteContentData = JSON.parse(readFileSync(contentJsonPath, "utf8"));
  } catch (e) {
    die(
      `content.json invalide (${contentJsonPath}) : ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  console.log(`✓ contenu éditorial chargé : ${path.relative(process.cwd(), contentJsonPath)}`);
}
if (!siteContentData) {
  // Contenu NEUTRE dérivé du contrat — aucun fait inventé, marqueurs explicites.
  const primaryCtaLabel =
    {
      contact: "Nous contacter",
      quote: "Demander un devis",
      booking: "Réserver",
      inquiry: "Nous écrire",
      subscribe: "S'abonner",
      purchase: "Découvrir",
    }[clientConfig.goals.primaryConversion] ?? "Nous contacter";
  siteContentData = {
    hero: {
      eyebrow: clientConfig.identity.tagline ?? "[À CONFIRMER — accroche]",
      title: clientConfig.identity.name,
      subtitle: clientConfig.seo?.defaultDescription ?? "[À CONFIRMER — description]",
      primaryCta: { label: primaryCtaLabel, href: "/contact" },
      secondaryCta: { label: "Découvrir", href: "#story" },
      media: null,
    },
    story: {
      heading: "[À CONFIRMER — titre de section]",
      intro: "[À CONFIRMER — introduction]",
      chapters: [
        { eyebrow: "01", title: "[À CONFIRMER]", body: "[À CONFIRMER — contenu du chapitre]" },
        { eyebrow: "02", title: "[À CONFIRMER]", body: "[À CONFIRMER — contenu du chapitre]" },
        { eyebrow: "03", title: "[À CONFIRMER]", body: "[À CONFIRMER — contenu du chapitre]" },
      ],
    },
    collection: {
      heading: "[À CONFIRMER — titre de collection]",
      intro: "[À CONFIRMER]",
      itemLabel: clientConfig.collections?.[0]?.itemLabel ?? "élément",
      items: [
        { title: "[À CONFIRMER]", href: "/realisations", meta: ["[À CONFIRMER]"], media: null },
        { title: "[À CONFIRMER]", href: "/realisations", meta: ["[À CONFIRMER]"], media: null },
      ],
    },
    conversion: {
      title: "[À CONFIRMER — appel à l'action]",
      description: "[À CONFIRMER]",
      primaryCta: { label: primaryCtaLabel, href: "/contact" },
    },
    nav: (clientConfig.pages ?? [])
      .filter((p) => p.enabled !== false)
      .map((p) => ({ label: p.title, href: p.path })),
  };
  if (siteContentData.nav.length === 0) {
    siteContentData.nav = [
      { label: "Accueil", href: "/" },
      { label: "Contact", href: "/contact" },
    ];
  }
}
const siteContentTs = `import type { SiteContent } from "./site-content.types";

/**
 * Contenu éditorial du site, généré par ace:new-site. Réécrit à chaque
 * génération ; ne pas éditer à la main. Tout marqueur [À CONFIRMER] doit être
 * remplacé par un fait vérifié avant publication.
 */
export const siteContent: SiteContent = ${JSON.stringify(siteContentData, null, 2)};
`;
writeFileSync(path.join(extracted, "src/config/site-content.ts"), siteContentTs);
console.log("✓ recipes résolues + contenu éditorial générés");

/* -------------------------------------------------------------------------- */
/* Rewrite de la home et de l'en-tête vers le rendu config-driven.             */
/* -------------------------------------------------------------------------- */
const homePageTs = `import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { ConfiguredHome } from "@/components/site/ConfiguredHome";
import { siteContent } from "@/config/site-content";

export const metadata: Metadata = buildMetadata({
  title: "Accueil",
  description: siteContent.hero.subtitle,
  path: "/",
});

/** Home config-driven : monte les recipes sélectionnées (voir ConfiguredHome). */
export default function HomePage() {
  return <ConfiguredHome />;
}
`;
writeFileSync(path.join(extracted, "src/app/page.tsx"), homePageTs);

// layout.tsx : remplace SiteHeader par ConfiguredHeader (recipe de navigation).
const layoutPath = path.join(extracted, "src/app/layout.tsx");
let layoutSrc = readFileSync(layoutPath, "utf8");
layoutSrc = layoutSrc
  .replace(
    'import { SiteHeader } from "@/components/layout/site-header";',
    'import { ConfiguredHeader } from "@/components/site/ConfiguredHeader";',
  )
  .replace(/<SiteHeader\s*\/>/, "<ConfiguredHeader />");
writeFileSync(layoutPath, layoutSrc);
console.log("✓ home + en-tête câblés sur les recipes sélectionnées");

// package.json : nom du site + retrait du script du générateur (scripts/ace
// est élagué — la commande "ace:new-site" n'aurait plus de fichier à exécuter).
const pkgPath = path.join(extracted, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = slug;
delete pkg.scripts?.["ace:new-site"];
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// ace.meta.json : traçabilité moteur ↔ site (diff/upgrade futur).
writeFileSync(
  path.join(extracted, "ace.meta.json"),
  JSON.stringify(
    {
      engine: "Aurexia Cinematic Engine",
      engineVersion: aceVersion,
      sourceCommit: commit,
      preset: clientConfig.design.preset,
      siteName: name,
      slug,
      recipes: clientConfig.recipes,
      generatedAt: null,
    },
    null,
    2,
  ) + "\n",
);
console.log("✓ identité + Design Language + features + recipes stampés");

// Proposition privée : noindex global + mention + exclusion sitemap (routes
// déjà exclues de sitemap.ts via robots quand noindex ; on force le flag SEO).
if (clientConfig.proposal?.isPrivateProposal) {
  const robotsMetaOverride = `import type { MetadataRoute } from "next";

/** Proposition privée non sollicitée — indexation désactivée globalement. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
`;
  writeFileSync(path.join(extracted, "src/app/robots.ts"), robotsMetaOverride);
  const emptySitemap = `import type { MetadataRoute } from "next";

/** Proposition privée non sollicitée — aucune URL soumise à indexation. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
`;
  writeFileSync(path.join(extracted, "src/app/sitemap.ts"), emptySitemap);
  console.log("✓ mode proposition privée : noindex global + sitemap vide");
}

/* -------------------------------------------------------------------------- */
/* F. Routes déclarées — rapport (le starter expose déjà home/about/contact/legal) */
/* -------------------------------------------------------------------------- */
const STANDARD_ROUTE_FILES = {
  home: "src/app/page.tsx",
  about: "src/app/a-propos/page.tsx",
  contact: "src/app/contact/page.tsx",
  legal: "src/app/mentions-legales/page.tsx",
  collection: "src/app/realisations/page.tsx",
};
const declaredPages = clientConfig.pages ?? [];
const pagesReport = declaredPages.map((p) => {
  const fileRel = p.standard ? STANDARD_ROUTE_FILES[p.standard] : undefined;
  const present = fileRel ? existsSync(path.join(extracted, fileRel)) : false;
  return { ...p, file: fileRel ?? null, present };
});
// features.collections=false : retirer la route collection générique si elle
// n'est déclarée dans aucune page active du contrat.
if (!resolvedFeatures.collections) {
  const collectionPageDeclared = declaredPages.some(
    (p) => p.standard === "collection" && p.enabled !== false,
  );
  if (!collectionPageDeclared) {
    rmSync(path.join(extracted, "src/app/realisations"), { recursive: true, force: true });
    console.log("✓ features.collections=false : route de collection retirée");
  }
}
// features.contactForm=false : la route /contact reste (coordonnées), mais on
// consigne l'état dans le rapport plutôt que de supprimer une fondation dont
// la suppression casserait les mises à jour futures.

/* -------------------------------------------------------------------------- */
/* Formatage Prettier des fichiers TS générés (site-content, client.resolved,  */
/* page.tsx, layout.tsx…). JSON.stringify produit un style non conforme ; on   */
/* laisse Prettier normaliser pour que le gate format:check du site passe.      */
/* -------------------------------------------------------------------------- */
const GENERATED_TS_ABS = [
  "src/config/site-content.ts",
  "src/config/client.resolved.ts",
  "src/config/features.generated.ts",
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
]
  .map((rel) => path.join(extracted, rel))
  .filter((abs) => existsSync(abs));
try {
  // Chemins ABSOLUS du staging : Prettier utilise le binaire + la config du
  // moteur mais n'écrit QUE dans le staging (jamais dans le dépôt moteur).
  execFileSync("pnpm", ["exec", "prettier", "--write", ...GENERATED_TS_ABS], {
    cwd: ROOT,
    stdio: "pipe",
  });
  console.log("✓ fichiers générés formatés (Prettier)");
} catch (e) {
  console.log(`⚠ formatage Prettier des fichiers générés ignoré : ${e.message ?? e}`);
}

/* -------------------------------------------------------------------------- */
/* J. Contrôle anti-fuite                                                     */
/* -------------------------------------------------------------------------- */
const FORBIDDEN_FILES = [/^\.env$/, /^\.env\.production/, /\.pem$/, /^node_modules$/, /^\.git$/];
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const KNOWN_CLIENT_IDENTITY_PATTERNS = [/in[ -]?quarto/i];
const FOREIGN_IDENTITY_PATTERNS = KNOWN_CLIENT_IDENTITY_PATTERNS.filter((re) => !re.test(name));
const INTERNAL_ROUTE_PATTERNS = [/src\/app\/lab\//, /src\/app\/ace-lab\//, /src\/app\/engine\//];
const MAX_FILE_BYTES = 500 * 1024;

const problems = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (FORBIDDEN_FILES.some((re) => re.test(entry.name))) {
      problems.push(`fichier interdit : ${path.relative(extracted, full)}`);
      continue;
    }
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const relPath = path.relative(extracted, full);
    if (INTERNAL_ROUTE_PATTERNS.some((re) => re.test(relPath))) {
      problems.push(`route interne Studio/Lab/Engine présente : ${relPath}`);
    }
    const size = statSync(full).size;
    if (size > MAX_FILE_BYTES && !relPath.startsWith("public/assets/client/")) {
      problems.push(`fichier lourd (${Math.round(size / 1024)} Ko) : ${relPath}`);
    }
    if (/\.(ts|tsx|js|mjs|json|md|env|local|yaml|yml|css)$/.test(entry.name) || size < 200_000) {
      const text = readFileSync(full, "utf8");
      for (const re of SECRET_PATTERNS) {
        if (re.test(text)) problems.push(`motif de secret détecté dans ${relPath}`);
      }
      for (const re of FOREIGN_IDENTITY_PATTERNS) {
        if (re.test(text)) problems.push(`identité client étrangère dans ${relPath}`);
      }
    }
  }
};
walk(extracted);

if (problems.length > 0) {
  console.error("✗ Contrôle de fuite ÉCHOUÉ :");
  for (const p of problems) console.error("  -", p);
  rmSync(staging, { recursive: true, force: true });
  process.exit(1);
}
console.log("✓ contrôle de fuite : aucun secret, aucune route interne, aucune identité étrangère");

/* -------------------------------------------------------------------------- */
/* Move into place                                                            */
/* -------------------------------------------------------------------------- */
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(extracted, target, { recursive: true });

/* -------------------------------------------------------------------------- */
/* I. Rapport de génération                                                   */
/* -------------------------------------------------------------------------- */
const generatedAt = new Date().toISOString();
// Re-stamp generatedAt now that it's known (kept null above — Date.now() must
// not run inside any cached/deterministic path upstream).
{
  const metaPath = path.join(target, "ace.meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.generatedAt = generatedAt;
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  const manifestPath = path.join(target, "public/assets/client/MANIFEST.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.generatedAt = generatedAt;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }
}

const reportLines = [
  "# ACE — Rapport de génération",
  "",
  `- Moteur : Aurexia Cinematic Engine v${aceVersion} (commit \`${commit.slice(0, 7)}\`)`,
  `- Généré le : ${generatedAt}`,
  `- Identité : ${name} (slug \`${slug}\`)`,
  `- Configuration source : \`${path.basename(configArg)}\``,
  "",
  "## Design Language",
  "",
  `- Preset : \`${clientConfig.design.preset}\``,
  `- Intensité motion : \`${clientConfig.design.motionIntensity}\``,
  `- Intensité WebGL : \`${clientConfig.design.webglIntensity}\``,
  `- Densité : \`${clientConfig.design.density}\``,
  `- Mode sombre disponible : ${clientConfig.design.darkMode ? "oui" : "non"}`,
  "",
  "## Features résolues",
  "",
  ...Object.entries(resolvedFeatures).map(([k, v]) => `- \`${k}\` : ${v ? "actif" : "inactif"}`),
  "",
  "## Recipes sélectionnées",
  "",
  ...Object.entries(clientConfig.recipes).map(([k, v]) => `- ${k} : \`${v ?? "(défaut moteur)"}\``),
  "",
  "## Pages déclarées",
  "",
  ...(pagesReport.length > 0
    ? pagesReport.map(
        (p) =>
          `- \`${p.path}\` (${p.key}) — ${p.title} — standard: ${p.standard ?? "—"} — ${p.present ? "présente" : "absente du starter (à créer)"}`,
      )
    : ["- Aucune page déclarée explicitement (routes standard du starter conservées)."]),
  "",
  "## Collections",
  "",
  clientConfig.collections && clientConfig.collections.length > 0
    ? clientConfig.collections.map((c) => `- \`${c.id}\` (${c.kind}) — ${c.label}`).join("\n")
    : "- Aucune collection déclarée.",
  "",
  "## Assets copiés",
  "",
  `- ${assetManifest.length} fichier(s) copié(s) sous \`public/assets/client/\` (voir MANIFEST.json)`,
  ...(assetProblems.length > 0
    ? ["", "### Avertissements assets", "", ...assetProblems.map((p) => `- ${p}`)]
    : []),
  "",
  "## Fichiers exclus (Studio/Lab/Engine + documents internes)",
  "",
  ...pruned.map((p) => `- \`${p}\``),
  "",
  "## Contrôle anti-fuite",
  "",
  "- ✓ aucun secret détecté",
  "- ✓ aucune route interne (`/lab`, `/ace-lab`, `/engine`) présente",
  "- ✓ aucune identité client étrangère détectée",
  "",
  "## Contenu temporaire restant",
  "",
  "- Toute valeur `[À CONFIRMER]` provient du gabarit `input/client.config.ts` /",
  "  `input/CLIENT_BRIEF.md` et doit être remplacée par des faits vérifiés avant",
  "  publication (voir `src/config/business.ts`).",
  "",
];
if (clientConfig.proposal?.isPrivateProposal) {
  reportLines.push(
    "## Mode proposition privée",
    "",
    "- `robots.ts` : indexation globalement désactivée.",
    "- `sitemap.ts` : aucune URL soumise.",
    "",
  );
}
writeFileSync(path.join(target, "docs/ACE-GENERATION-REPORT.md"), reportLines.join("\n"));
console.log("✓ rapport de génération : docs/ACE-GENERATION-REPORT.md");

rmSync(staging, { recursive: true, force: true });

/* -------------------------------------------------------------------------- */
/* J. Quality gates (sauf --skip-check)                                       */
/* -------------------------------------------------------------------------- */
function runStep(title, fn) {
  console.log(`\n▸ ${title}`);
  try {
    fn();
    console.log(`✓ ${title}`);
    return true;
  } catch (e) {
    console.error(`✗ ${title} — ÉCHEC`);
    if (e.stdout) console.error(e.stdout.toString());
    if (e.stderr) console.error(e.stderr.toString());
    return false;
  }
}

if (!skipInstall) {
  const installOk = runStep("installation (pnpm install --frozen-lockfile)", () => {
    execFileSync("pnpm", ["install", "--frozen-lockfile"], { cwd: target, stdio: "pipe" });
  });
  if (!installOk) {
    console.error(
      `\n✗ Génération INTERROMPUE après échec d'installation. Site généré à ${target} mais non vérifié.`,
    );
    process.exit(1);
  }
}

if (!skipCheck) {
  const steps = [
    [
      "format:check",
      () => execFileSync("pnpm", ["run", "format:check"], { cwd: target, stdio: "pipe" }),
    ],
    ["lint", () => execFileSync("pnpm", ["run", "lint"], { cwd: target, stdio: "pipe" })],
    ["typecheck", () => execFileSync("pnpm", ["run", "typecheck"], { cwd: target, stdio: "pipe" })],
    ["test", () => execFileSync("pnpm", ["run", "test"], { cwd: target, stdio: "pipe" })],
    ["build", () => execFileSync("pnpm", ["run", "build"], { cwd: target, stdio: "pipe" })],
  ];
  let allGreen = true;
  for (const [title, fn] of steps) {
    const ok = runStep(title, fn);
    if (!ok) {
      allGreen = false;
      break; // une étape rouge arrête la chaîne — jamais annoncée comme réussie.
    }
  }
  if (!allGreen) {
    console.error(
      `\n✗ Quality gates ÉCHOUÉS. Site généré à ${target} mais NON validé — corriger avant livraison.`,
    );
    process.exit(1);
  }
}

console.log(`\n✓ Site généré et validé : ${target}\n`);
console.log("Étapes suivantes :");
console.log(`  cd ${target}`);
console.log("  git init && git add -A && git commit -m 'chore: bootstrap from ACE'");
if (skipInstall) console.log("  pnpm install");
if (skipCheck) console.log("  pnpm check          # lint + typecheck + tests + build");
console.log("  # remplir les [À CONFIRMER] restants dans input/ puis src/config/business.ts");
