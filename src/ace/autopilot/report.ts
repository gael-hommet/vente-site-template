import type { AutopilotMission } from "./types";
import { humanLabel, progressOf } from "./state";

/**
 * ACE AUTOPILOT — rapports.
 *
 * DEUX publics, deux rapports, jamais mélangés :
 *  - l'utilisateur : ce qu'il a maintenant, en français, sans jargon ;
 *  - le rapport interne : tout le détail technique, pour moi/le debug/la CI.
 *
 * Règle : le rapport utilisateur ne contient ni nom de commande, ni nombre de
 * tests, ni terme technique non expliqué — et il dit toujours ce qui N'A PAS
 * été fait (notamment : aucune publication).
 */

/** Ce qu'ACE a réellement produit, formulé côté bénéfice. */
function deliveredItems(mission: AutopilotMission): string[] {
  const items: string[] = [];
  if (mission.targetDir) items.push("un site complet, prêt à être regardé");
  if (mission.artDirection)
    items.push("une identité visuelle sur mesure (couleurs, typographie, rythme)");
  items.push("une version ordinateur et une version mobile");
  if (mission.artDirection && mission.artDirection.motionIntensity !== "none") {
    items.push("des animations au défilement");
  }
  if (mission.mediaManifestPath) items.push("des visuels produits et contrôlés");
  items.push("un formulaire de contact fonctionnel");
  items.push("les pages essentielles (accueil, présentation, contact, mentions légales)");
  return items;
}

/** Points à confirmer : ce qu'ACE n'a pas pu vérifier (jamais inventé). */
function pendingConfirmations(mission: AutopilotMission): string[] {
  return mission.facts.notFound.map((k) => `${k} (laissé à confirmer, rien n'a été inventé)`);
}

/**
 * Rapport UTILISATEUR — court, concret, sans jargon.
 * C'est la seule chose qu'une personne non technique doit lire.
 */
export function userReport(mission: AutopilotMission): string {
  const lines: string[] = [];

  if (mission.state === "COMPLETE") {
    lines.push("Le site est prêt.");
    if (mission.previewUrl) {
      lines.push(`Aperçu : ${mission.previewUrl}`);
    } else if (mission.targetDir) {
      // On n'invente pas une adresse : on dit comment ouvrir l'aperçu.
      lines.push(`Pour l'ouvrir : demandez-moi « montre-moi l'aperçu ».`);
    }
    lines.push("");
    lines.push("J'ai créé :");
    for (const item of deliveredItems(mission)) lines.push(`- ${item}`);
    const pending = pendingConfirmations(mission);
    if (pending.length > 0) {
      lines.push("");
      lines.push("À confirmer avec le client avant publication :");
      for (const p of pending) lines.push(`- ${p}`);
    }
    lines.push("");
    lines.push("Aucune publication n'a été faite : le site reste sur votre machine.");
    return lines.join("\n");
  }

  if (mission.state === "BLOCKED") {
    lines.push("Je ne peux pas continuer sans une action de votre côté.");
    lines.push("");
    if (mission.blockedMessage) lines.push(mission.blockedMessage);
    lines.push("");
    lines.push(
      "Le travail déjà fait est conservé : dès que c'est réglé, je reprends où j'en étais.",
    );
    return lines.join("\n");
  }

  // Mission en cours.
  const pct = Math.round(progressOf(mission.state) * 100);
  lines.push(`En cours : ${humanLabel(mission.state)} (${String(pct)} %)`);
  return lines.join("\n");
}

/** Rapport INTERNE — tout le détail, réservé au moteur / au debug / à la CI. */
export function technicalReport(mission: AutopilotMission): string {
  const l: string[] = [];
  l.push(`# Rapport technique — mission ${mission.id}`);
  l.push("");
  l.push(`- Brief : « ${mission.brief} »`);
  l.push(`- Slug : ${mission.slug}`);
  l.push(`- Dossier : ${mission.targetDir ?? "(non créé)"}`);
  l.push(`- État : ${mission.state}`);
  if (mission.blockedReason) l.push(`- Blocage : ${mission.blockedReason}`);
  l.push(`- Créée : ${mission.createdAt} · MàJ : ${mission.updatedAt}`);
  l.push("");

  l.push("## Intention détectée");
  l.push("");
  l.push(
    `- Mission de site : ${String(mission.intent.isSiteMission)} (confiance ${String(mission.intent.confidence)})`,
  );
  l.push(`- Entreprise : ${mission.intent.businessName ?? "(non extraite)"}`);
  l.push(`- Source : ${mission.intent.sourceUrl ?? "(aucune)"}`);
  l.push(`- Secteur : ${mission.intent.industry ?? "(non détecté)"}`);
  l.push(`- Livrable : ${mission.intent.deliverable} · Langue : ${mission.intent.locale}`);
  l.push(`- Style demandé : ${mission.intent.styleHints.join(", ") || "(aucun)"}`);
  l.push("");

  l.push("## Faits");
  l.push("");
  if (mission.facts.facts.length === 0) {
    l.push("- Aucun fait enregistré.");
  } else {
    for (const f of mission.facts.facts) {
      l.push(`- \`${f.key}\` = ${f.value} — source : ${f.source} (${f.confidence})`);
    }
  }
  if (mission.facts.notFound.length > 0) {
    l.push("");
    l.push(`Non trouvés (⇒ [À CONFIRMER]) : ${mission.facts.notFound.join(", ")}`);
  }
  l.push("");

  if (mission.artDirection) {
    const ad = mission.artDirection;
    l.push("## Direction artistique");
    l.push("");
    l.push(`- Concept : ${ad.concept}`);
    l.push(
      `- Preset : ${ad.preset} · motion ${ad.motionIntensity} · webgl ${ad.webglIntensity} · densité ${ad.density}`,
    );
    l.push(
      `- Recipes : ${Object.entries(ad.recipes)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
    l.push(`- Justification : ${ad.rationale}`);
    l.push(`- Affinée par l'agent : ${String(ad.agentSupplied)}`);
    l.push("");
  }

  l.push("## Étapes exécutées");
  l.push("");
  if (mission.steps.length === 0) {
    l.push("- Aucune.");
  } else {
    for (const s of mission.steps) {
      const status = s.endedAt === null ? "en cours" : s.ok ? "ok" : "échec";
      l.push(`- ${s.state} — ${status}`);
      for (const c of s.commands) l.push(`    $ ${c}`);
      for (const n of s.notes) l.push(`    · ${n}`);
    }
  }
  l.push("");

  if (mission.iterations.length > 0) {
    l.push("## Itérations qualité");
    l.push("");
    for (const it of mission.iterations) {
      l.push(
        `- Passe ${String(it.round)} — score ${it.score === null ? "non évalué" : String(it.score)}`,
      );
      for (const i of it.issues) l.push(`    ✗ ${i}`);
      for (const f of it.fixed) l.push(`    ✓ ${f}`);
    }
    l.push("");
  }

  l.push("## Publication");
  l.push("");
  l.push("- Aucune. AUTOPILOT ne pousse ni ne déploie jamais automatiquement.");
  return l.join("\n");
}

/** Ligne d'état compacte pour la CLI. */
export function statusLine(mission: AutopilotMission): string {
  const pct = Math.round(progressOf(mission.state) * 100);
  return `${mission.slug} · ${mission.state} (${String(pct)} %) · ${humanLabel(mission.state)}`;
}
