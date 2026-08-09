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
 *   pnpm ace:autopilot approve                                   # accord dépense
 *   pnpm ace:autopilot resume                                    # reprise
 *   pnpm ace:autopilot report [--technical]
 *
 * Sorties : 0 = avancé/terminé · 3 = besoin de l'agent · 4 = bloqué ·
 * 5 = attente d'accord · 2 = usage.
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
  detectIntent,
  endStep,
  environmentGate,
  factsGate,
  missionSlug,
  providerGate,
  qualityGate,
  requiresGeneratedMedia,
  resumeState,
  spendGate,
  statusLine,
  technicalReport,
  unblock,
  userReport,
  type AutopilotMission,
  type AutopilotState,
  type FactRegistry,
} from "@/ace/autopilot";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MISSION_DIR = path.join(ROOT, ".ace/missions");

const argv = process.argv.slice(2);
const KNOWN_COMMANDS = [
  "start",
  "run",
  "resume",
  "supply",
  "approve",
  "status",
  "report",
  "list",
] as const;
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
  process.exit(m.state === "WAITING_FOR_APPROVAL" ? 5 : 4);
}

/* -------------------------------------------------------------------------- */
/* Étapes automatisables                                                      */
/* -------------------------------------------------------------------------- */

/** SITE_BOOTSTRAP : génère réellement le projet client via ace:new-site. */
function doSiteBootstrap(m: AutopilotMission): AutopilotMission {
  const outDir = path.resolve(ROOT, "..", m.slug);
  const configPath = path.join(MISSION_DIR, `${m.id}.client.config.ts`);

  const ad =
    m.artDirection ??
    decideArtDirection(m.intent, { hasUsableAssets: m.providedAssets.length > 0 });
  const name = m.intent.businessName ?? m.slug;
  const isDemo = m.intent.deliverable === "demo";

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
  return endStep(
    { ...m, targetDir: outDir, artDirection: ad },
    { ok: true, commands: [cmd], notes: [`projet créé dans ${outDir}`] },
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

  // Les visuels FOURNIS par le client sont réellement câblés dans la page :
  // les copier sans les afficher reviendrait à livrer un site vide de leur
  // matière. `public/assets/client/<f>` est servi sous `/assets/client/<f>`.
  const assetUrls = m.providedAssets
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .map((f) => `/assets/client/${f}`);
  const heroMedia = assetUrls[0]
    ? { src: assetUrls[0], alt: `${m.intent.businessName ?? m.slug} — visuel principal` }
    : null;

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
        // Les visuels restants illustrent la collection, dans l'ordre fourni.
        media: assetUrls[idx + 1] ? { src: assetUrls[idx + 1] as string, alt: i.title } : null,
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
  // Borne dure : la machine a 20 transitions max par invocation (anti-boucle).
  for (let guard = 0; guard < 20; guard += 1) {
    if (m.state === "COMPLETE" || m.state === "BLOCKED" || m.state === "WAITING_FOR_APPROVAL")
      break;

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
        // Un script ne sait pas chercher sur le web : c'est le travail de l'agent.
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

      case "SITE_BOOTSTRAP":
        m = doSiteBootstrap(m);
        if (m.state === "BLOCKED") break;
        m = advance(m, now());
        break;

      case "ART_DIRECTION": {
        const ad =
          m.artDirection ??
          decideArtDirection(m.intent, { hasUsableAssets: m.providedAssets.length > 0 });
        m = { ...m, artDirection: ad };
        m = endStep(m, { ok: true, notes: [`concept : ${ad.concept}`, ad.rationale] }, now());
        m = advance(m, now());
        break;
      }

      case "CONTENT": {
        if (!m.content) {
          m = endStep(m, { ok: false, notes: ["rédaction déléguée à l'agent"] }, now());
          saveMission(m);
          emitAgentRequest(m, "CONTENT");
        }
        const written = writeSiteContent(m);
        m = endStep(
          m,
          written.ok
            ? { ok: true, commands: [], notes: [`contenu écrit dans ${written.file}`] }
            : { ok: false, notes: [written.error ?? "écriture du contenu impossible"] },
          now(),
        );
        if (!written.ok) {
          m = block(
            m,
            "UNRECOVERABLE_ERROR",
            now(),
            "Le contenu n'a pas pu être écrit dans le site.",
          );
          break;
        }
        m = advance(m, now());
        break;
      }

      case "MEDIA_PLAN": {
        const ad = m.artDirection;
        const hasAssets = m.providedAssets.length > 0;
        const mediaRequired = ad
          ? requiresGeneratedMedia(ad, { hasUsableAssets: hasAssets })
          : false;
        const doctor = runDoctor();
        const gate = providerGate({
          mediaRequired,
          providerAuthenticated: doctor.canGenerateMedia,
        });
        if (!gate.pass) {
          m = endStep(m, { ok: false, notes: [gate.detail ?? gate.message] }, now());
          m = block(m, "ADMIN_PROVIDER_AUTH_REQUIRED", now());
          break;
        }
        m = endStep(
          m,
          {
            ok: true,
            notes: [
              hasAssets
                ? `${String(m.providedAssets.length)} asset(s) fourni(s) : aucune génération nécessaire`
                : mediaRequired
                  ? "médias générés requis"
                  : "aucun média généré requis",
              gate.message,
            ],
          },
          now(),
        );
        m = advance(m, now());
        break;
      }

      case "MEDIA_GENERATION": {
        if (m.providedAssets.length > 0) {
          m = endStep(
            m,
            { ok: true, notes: ["assets du client utilisés : aucune génération"] },
            now(),
          );
          m = advance(m, now());
          break;
        }
        const doctor = runDoctor();
        if (!doctor.canGenerateMedia) {
          // Pas de provider : on ne fabrique JAMAIS un substitut cheap.
          m = endStep(
            m,
            { ok: true, notes: ["aucun provider : version éditoriale premium assumée"] },
            now(),
          );
          m = advance(m, now());
          break;
        }
        // Coût : au-dessus du seuil, on demande UNE fois.
        const gate = spendGate({
          estimatedTotal: null,
          currency: "provider",
          approved: Boolean(opt("--approved")) || argv.includes("--approved"),
        });
        if (!gate.pass) {
          m = endStep(m, { ok: false, notes: [gate.message] }, now());
          m = block(m, "SPEND_APPROVAL_REQUIRED", now(), gate.message);
          break;
        }
        m = endStep(m, { ok: true, notes: ["génération autorisée"] }, now());
        m = advance(m, now());
        break;
      }

      case "MEDIA_QA":
      case "SITE_BUILD":
      case "MOBILE_QA": {
        // Étapes couvertes par TECHNICAL_QA et le media-engine ; tracées ici.
        m = endStep(m, { ok: true, notes: ["rien à produire à cette étape"] }, now());
        m = advance(m, now());
        break;
      }

      case "VISUAL_QA": {
        // Le jugement visuel exige de REGARDER : c'est le travail de l'agent.
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
            // Plusieurs passes n'ont pas suffi : on le DIT plutôt que de livrer.
            m = block(m, "QUALITY_NOT_REACHED", now());
            break;
          }
          // Une passe de plus : les défauts relevés doivent d'abord être corrigés.
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

      case "TECHNICAL_QA": {
        m = doTechnicalQa(m);
        if (m.state === "BLOCKED") break;
        const failed = m.steps[m.steps.length - 1]?.ok === false;
        if (failed) {
          m = block(m, "UNRECOVERABLE_ERROR", now(), "Les vérifications techniques ont échoué.");
          break;
        }
        m = advance(m, now());
        break;
      }

      case "PREVIEW": {
        // On ne démarre pas de serveur bloquant ici : on donne la commande, que
        // l'agent lance en tâche de fond. On n'AFFIRME une URL que si un serveur
        // répond réellement — sinon on donne la marche à suivre.
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
    if (m.state === "BLOCKED" || m.state === "WAITING_FOR_APPROVAL") emitBlocked(m);
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
    if (m.state === "BLOCKED" || m.state === "WAITING_FOR_APPROVAL") emitBlocked(m);
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
    if (after.state === "BLOCKED" || after.state === "WAITING_FOR_APPROVAL") emitBlocked(after);
    console.log("\n" + userReport(after));
    break;
  }

  case "approve": {
    const m = requireMission();
    if (m.state !== "WAITING_FOR_APPROVAL") die("aucune approbation en attente.", 2);
    const resumed = unblock(m, "MEDIA_GENERATION", now());
    saveMission(resumed);
    console.log("  Accord enregistré. Relancez : pnpm ace:autopilot run --approved");
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
        '  usage : --brief "..." | run | resume | supply | approve | status | report | list',
    );
}
