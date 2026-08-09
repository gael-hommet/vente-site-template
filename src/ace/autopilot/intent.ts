import type { AutopilotIntent } from "./types";

/**
 * ACE AUTOPILOT — détection d'intention (pure, testable).
 *
 * Transforme une phrase libre en intention exploitable. Principe directeur du
 * mandat : **INFER OR RESEARCH FIRST, ASK ONLY WHEN BLOCKED**. On ne pose pas
 * de questionnaire ; on extrait ce qu'on peut et on liste honnêtement ce qui
 * reste à chercher (`unknowns`).
 *
 * Ce module ne fait AUCUNE recherche : il prépare le terrain. La recherche
 * publique est le travail de l'agent (phase RESEARCH).
 */

/** Verbes/formules qui signalent une demande de site. */
const MISSION_PATTERNS: readonly RegExp[] = [
  /\b(fais|fais-moi|faire|cr[ée]e?|cr[ée]er|construis|construire|monte|monter)\b[^.]{0,40}\bsite\b/i,
  /\b(refais|refaire|refonte|redesign|moderniser|relooker)\b/i,
  /\bsite\b[^.]{0,30}\b(premium|vitrine|web|internet)\b/i,
  /\b(make|build|create)\b[^.]{0,30}\b(website|site|landing)\b/i,
  /\bd[ée]mo\b[^.]{0,30}\b(priv[ée]e?|client|prospect)\b/i,
];

/** Secteurs → alignés sur INDUSTRIES du schéma client. */
const INDUSTRY_HINTS: Record<string, readonly RegExp[]> = {
  hospitality: [
    /\brestaurant\b/i,
    /\bh[oô]tel\b/i,
    /\bbistrot\b/i,
    /\bbrasserie\b/i,
    /\bcaf[ée]\b/i,
    /\btraiteur\b/i,
    /\bchambre d'h[oô]tes\b/i,
    /\bg[îi]te\b/i,
  ],
  architecture: [
    /\barchitect/i,
    /\bma[îi]tre d'[œo]uvre\b/i,
    /\burbanis/i,
    /\bchalet/i,
    /\bconstruction\b/i,
  ],
  "real-estate": [/\bimmobili[eè]r/i, /\bagence immo/i, /\bpromoteur\b/i],
  automotive: [/\bgarage\b/i, /\bconcession/i, /\bautomobile\b/i, /\bcarrosserie\b/i],
  medical: [
    /\bm[ée]decin\b/i,
    /\bdentiste\b/i,
    /\bdentaire\b/i,
    /\bclinique\b/i,
    /\bcabinet m[ée]dical\b/i,
    /\bkin[ée]si/i,
    /\bostéopath/i,
    /\borthodont/i,
    /\bp[ée]diatr/i,
    /\bv[ée]t[ée]rinaire\b/i,
    /\bpodolog/i,
    /\bm[ée]dical\b/i,
  ],
  luxury: [
    /\bjoaillerie\b/i,
    /\bhorlogerie\b/i,
    /\bhaute couture\b/i,
    /\bmaroquinerie\b/i,
    /\bparfum/i,
  ],
  industry: [/\bindustrie\b/i, /\busine\b/i, /\bmanufactur/i, /\bm[ée]tallurg/i],
  culture: [/\bmus[ée]e\b/i, /\bgalerie\b/i, /\bth[ée][âa]tre\b/i, /\bfestival\b/i, /\bartiste\b/i],
  technology: [/\bstartup\b/i, /\blogiciel\b/i, /\bsaas\b/i, /\bapplication\b/i, /\btech\b/i],
  "professional-services": [
    /\bavocat\b/i,
    /\bnotaire\b/i,
    /\bcomptab/i,
    /\bconseil\b/i,
    /\bcabinet\b/i,
    /\bconsultant\b/i,
  ],
};

/**
 * Mots de style → indices CANONIQUES.
 *
 * On stocke le mot canonique (et non le fragment capturé par la regex) : sinon
 * « immersif » ressortirait en « immersi » et ne serait reconnu par personne en
 * aval. La direction artistique consomme ces clés telles quelles.
 */
const STYLE_HINTS: Record<string, RegExp> = {
  premium: /\bpremium\b|\bhaut de gamme\b/i,
  luxe: /\bluxe\b|\bluxueux\b|\bluxueuse\b/i,
  moderne: /\bmoderne\b/i,
  minimaliste: /\bminimalis/i,
  épuré: /\b[ée]pur[ée]/i,
  sobre: /\bsobre\b/i,
  chaleureux: /\bchaleureux\b|\bchaleureuse\b/i,
  rassurant: /\brassurant\b|\brassurante\b/i,
  classe: /\bclasse\b/i,
  élégant: /\b[ée]l[ée]gant/i,
  audacieux: /\baudacieux\b/i,
  cinématique: /\bcin[ée]matique\b/i,
  immersif: /\bimmersi[fv]?e?\b/i,
  artisanal: /\bartisanal\b|\bartisanale\b/i,
  naturel: /\bnaturel\b|\bnaturelle\b/i,
  institutionnel: /\binstitutionnel\b/i,
};

/** Conversion attendue. */
const CONVERSION_HINTS: Record<string, readonly RegExp[]> = {
  booking: [/\br[ée]serv/i, /\bbooking\b/i, /\bprendre rendez-vous\b/i, /\brdv\b/i],
  quote: [/\bdevis\b/i, /\bestimation\b/i, /\bchiffrage\b/i],
  purchase: [/\bboutique\b/i, /\bvendre en ligne\b/i, /\be-?commerce\b/i, /\bacheter\b/i],
  subscribe: [/\bnewsletter\b/i, /\bs'abonner\b/i, /\binscription\b/i],
  inquiry: [/\bdemande d'information\b/i, /\bformulaire de contact\b/i],
};

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/i;
/** Domaine nu (« exemple.fr ») — sans faux positif sur les fins de phrase. */
const BARE_DOMAIN_RE =
  /\b((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|fr|be|ch|ca|eu|net|org|io|co|studio|paris|shop))\b/i;

function firstMatch(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

/** Extrait l'URL (complète, sinon domaine nu normalisé en https). */
export function extractUrl(text: string): string | null {
  const full = URL_RE.exec(text);
  if (full) return full[0].replace(/[.,;]$/, "");
  const bare = BARE_DOMAIN_RE.exec(text);
  return bare?.[1] ? `https://${bare[1]}` : null;
}

/**
 * Extrait un nom d'entreprise. Volontairement CONSERVATEUR : mieux vaut ne rien
 * proposer (et laisser la recherche trancher) que d'inventer une raison sociale.
 */
export function extractBusinessName(text: string): string | null {
  // 1) Formulation explicite : « pour <Nom>, une entreprise… » / « pour <Nom> : »
  const explicit =
    /\bpour\s+((?:[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'&-]*)(?:\s+(?:[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'&-]*|de|du|des|le|la|les|d'|et)){0,4})/u.exec(
      text,
    );
  if (explicit?.[1]) {
    const cleaned = explicit[1].trim().replace(/\s+(un|une|le|la|les|ce|cette)$/i, "");
    // Un simple « pour Ce Restaurant » n'est pas un nom d'entreprise.
    if (!/^(ce|cette|ces|mon|ma|mes|leur|leurs|nous)\b/i.test(cleaned) && cleaned.length > 2) {
      return cleaned;
    }
  }
  // 2) Guillemets français ou droits.
  const quoted = /[«"']\s*([^»"']{2,60}?)\s*[»"']/u.exec(text);
  if (quoted?.[1] && /[A-ZÀ-Þ]/u.test(quoted[1])) return quoted[1].trim();
  return null;
}

/** Devine le secteur à partir du vocabulaire. */
export function detectIndustry(text: string): string | null {
  for (const [industry, patterns] of Object.entries(INDUSTRY_HINTS)) {
    if (firstMatch(text, patterns)) return industry;
  }
  return null;
}

/** Slug technique dérivé d'un nom (jamais exposé à l'utilisateur). */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Le générateur exige [a-z][a-z0-9-]* : on préfixe si besoin.
  return /^[a-z]/.test(base) ? base : `site-${base || "sans-nom"}`;
}

/** Détecte la langue demandée (par défaut français : public cible du moteur). */
function detectLocale(text: string): string {
  if (/\ben anglais\b|\bin english\b/i.test(text)) return "en-US";
  if (/\ben espagnol\b/i.test(text)) return "es-ES";
  return "fr-FR";
}

function detectDeliverable(text: string): AutopilotIntent["deliverable"] {
  if (/\bd[ée]mo\b|\bmaquette\b|\bprospect\b|\bnon sollicit/i.test(text)) return "demo";
  if (/\brefais|refonte|redesign|refaire|moderniser|relooker\b/i.test(text)) return "redesign";
  return "new-site";
}

function detectConversion(text: string): string | null {
  for (const [conversion, patterns] of Object.entries(CONVERSION_HINTS)) {
    if (firstMatch(text, patterns)) return conversion;
  }
  return null;
}

/**
 * Analyse la phrase de l'utilisateur.
 *
 * `isSiteMission` reste faux si rien n'indique une demande de site : AUTOPILOT
 * ne s'auto-déclenche pas sur une question ordinaire.
 */
export function detectIntent(brief: string): AutopilotIntent {
  const text = brief.trim();
  const isSiteMission = firstMatch(text, MISSION_PATTERNS);

  const sourceUrl = extractUrl(text);
  const businessName = extractBusinessName(text);
  const industry = detectIndustry(text);
  const styleHints = Object.entries(STYLE_HINTS)
    .filter(([, re]) => re.test(text))
    .map(([canonical]) => canonical);

  // Score de confiance : signaux explicites cumulés, plafonné à 1.
  let confidence = isSiteMission ? 0.6 : 0.1;
  if (sourceUrl) confidence += 0.15;
  if (businessName) confidence += 0.15;
  if (industry) confidence += 0.1;
  confidence = Math.min(1, Number(confidence.toFixed(2)));

  // Ce qui manque doit être CHERCHÉ, pas demandé d'emblée.
  const unknowns: string[] = [];
  if (!businessName) unknowns.push("nom exact de l'entreprise");
  if (!sourceUrl) unknowns.push("site ou page publique de référence");
  if (!industry) unknowns.push("secteur d'activité");
  unknowns.push("coordonnées vérifiables (adresse, téléphone, horaires)");
  unknowns.push("offre et services réels");

  return {
    isSiteMission,
    confidence,
    businessName,
    sourceUrl,
    industry,
    styleHints: [...new Set(styleHints)],
    deliverable: detectDeliverable(text),
    locale: detectLocale(text),
    primaryConversion: detectConversion(text),
    unknowns,
  };
}

/**
 * Slug de mission : dérivé du nom, sinon du domaine, sinon générique.
 * Déterministe (aucune horloge) pour rester testable.
 */
export function missionSlug(intent: AutopilotIntent): string {
  if (intent.businessName) return slugify(intent.businessName);
  if (intent.sourceUrl) {
    try {
      const host = new URL(intent.sourceUrl).hostname.replace(/^www\./, "");
      return slugify(host.split(".")[0] ?? host);
    } catch {
      /* URL non parsable : on retombe sur le générique. */
    }
  }
  return "site-client";
}
