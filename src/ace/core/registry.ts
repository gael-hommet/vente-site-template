/**
 * Generic typed registry used by the Motion Library, the Scene Library and the
 * Design Language presets. Entries are registered at module load, are
 * immutable afterwards, and duplicate ids are a programming error (throw).
 */

export interface RegistryEntry {
  /** Stable, unique, kebab-case or dotted identifier (e.g. "reveal.soft"). */
  id: string;
}

export interface Registry<T extends RegistryEntry> {
  get(id: string): T;
  has(id: string): boolean;
  list(): readonly T[];
  ids(): readonly string[];
}

export function createRegistry<T extends RegistryEntry>(
  kind: string,
  entries: readonly T[],
): Registry<T> {
  const byId = new Map<string, T>();
  for (const entry of entries) {
    if (!entry.id) {
      throw new Error(`[ace:${kind}] entry without id`);
    }
    if (byId.has(entry.id)) {
      throw new Error(`[ace:${kind}] duplicate id "${entry.id}"`);
    }
    byId.set(entry.id, entry);
  }

  return {
    get(id) {
      const entry = byId.get(id);
      if (!entry) {
        throw new Error(`[ace:${kind}] unknown id "${id}". Known: ${[...byId.keys()].join(", ")}`);
      }
      return entry;
    },
    has: (id) => byId.has(id),
    list: () => [...byId.values()],
    ids: () => [...byId.keys()],
  };
}
