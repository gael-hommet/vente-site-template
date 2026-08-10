# PERFORMANCE-AUDIT — Poids, chargement, CWV

> Audit ACE · 2026-07-17

## 1. Constats positifs (vérifiés dans le code / build)

- Build production Turbopack vert (2026-07-17) ; 9 routes, `/api/lead` seule route dynamique — tout le reste est statique.
- `next/image` avec AVIF/WebP activés ; `remotePatterns` vide (aucun host distant implicite) ; SVG servis sous CSP stricte (`script-src 'none'; sandbox`).
- `next/font` (Geist ×2 + Space Grotesk, `display: swap`) — pas de FOUT/FOIT.
- `optimizePackageImports` sur lucide-react, motion, drei ; `transpilePackages` ciblé écosystème three.
- 3D et intégrations optionnelles hors bundle initial (dynamic imports, `optional/load.ts` + turbopackIgnore).
- Anti-CLS : conteneurs de scènes avec aspect ratio, posters pour médias différés, states/skeletons dimensionnés.
- Aucun asset lourd committé (public/ = SVG placeholders ; input/assets vide).
- Pipeline compression : sharp (images), ffmpeg 7.1.5 (vidéo, présent dans l'image dev), gltf-transform (Draco/meshopt).

## 2. Limites actuelles

| Constat                                                                | Impact                                                              | Recommandation                                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Pas de mesure CWV automatisée (Lighthouse/bundle budget chiffré en CI) | Les budgets de `docs/PERFORMANCE-BUDGET.md` ne sont pas exécutoires | Intégrer une mesure dans l'ACE Score (étape 15) : audit Lighthouse local + taille de bundle par route comparée au budget |
| `pnpm audit:site` existe mais ne mesure pas la perf runtime            | idem                                                                | Étendre audit-site.mjs ou l'adosser à l'ACE Score                                                                        |
| Aucune vraie page riche encore (la home de démo est légère)            | Les chiffres actuels ne prédisent pas un site client complet        | Mesurer sur le starter neutre (étape 6) puis sur Site témoin A                                                           |

## 3. Verdict

Toutes les bonnes pratiques structurelles sont en place ; le manque est la
**mesure continue** (budgets exécutoires), à traiter dans l'ACE Score plutôt
que par des correctifs immédiats.
