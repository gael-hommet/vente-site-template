/**
 * Point d'entrée Node/TS du CLI pour charger une configuration client.
 *
 * Exécuté via `pnpm exec tsx` (résout `tsconfig.json#paths` nativement — pas de
 * duplication du schéma ici). Reçoit le chemin d'un fichier `client.config.ts`
 * (export par défaut = `ClientConfigInput`), le valide via le contrat unique
 * `src/ace/config` (`loadClientConfig`), et écrit le résultat en JSON sur
 * stdout pour que le générateur Node (`new-site.mjs`, pur JS) le consomme sans
 * jamais dupliquer le schéma Zod ni importer le registre React complet.
 *
 * Usage : pnpm exec tsx scripts/ace/load-client-config.ts <chemin-config.ts>
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ClientConfigError, loadClientConfig } from "@/ace/config";
import type { ClientConfigInput } from "@/ace/config";

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error(
      JSON.stringify({
        ok: false,
        issues: ["argument requis : chemin du fichier client.config.ts"],
      }),
    );
    process.exit(1);
  }

  const absolute = path.resolve(process.cwd(), configPath);
  let mod: { default?: ClientConfigInput };
  try {
    mod = await import(pathToFileURL(absolute).href);
  } catch (e) {
    console.error(
      JSON.stringify({
        ok: false,
        issues: [
          `impossible d'importer "${configPath}" : ${e instanceof Error ? e.message : String(e)}`,
        ],
      }),
    );
    process.exit(1);
    return;
  }

  const input = mod.default;
  if (!input || typeof input !== "object") {
    console.error(
      JSON.stringify({
        ok: false,
        issues: [`"${configPath}" doit avoir un export par défaut (objet ClientConfigInput).`],
      }),
    );
    process.exit(1);
    return;
  }

  try {
    const loaded = loadClientConfig(input);
    // JSON sérialisable : le générateur Node (mjs) consomme ce résultat sans
    // jamais réimporter Zod ni le registre React.
    console.log(JSON.stringify({ ok: true, config: loaded.config, features: loaded.features }));
  } catch (e) {
    if (e instanceof ClientConfigError) {
      console.error(JSON.stringify({ ok: false, issues: e.issues }));
    } else {
      console.error(
        JSON.stringify({ ok: false, issues: [e instanceof Error ? e.message : String(e)] }),
      );
    }
    process.exit(1);
  }
}

void main();
