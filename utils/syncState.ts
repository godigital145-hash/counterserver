/**
 * sync_state helper — index de version partagé entre serveur et clients.
 *
 * Rôle :
 * - Maintenir une ligne par entité syncable (table_name + element_id) avec un compteur `version`.
 * - À chaque écriture métier (INSERT/UPDATE/DELETE) on incrémente `version`.
 * - Les clients pull `/sync-state?since=<v>` pour ne recevoir que les deltas.
 *
 * Phase 1 : seules les écritures sont instrumentées. La lecture/LWW arrive en Phase 2.
 */

type ENV = Partial<CloudflareBindings>;

const getDB = (env: ENV): D1Database | null => {
  const D1 = (env as any).DB as D1Database | undefined;
  return D1 ?? null;
};

export type SyncableTable =
  | "notes"
  | "groupes"
  | "articles"
  | "publish"
  | "comments"
  | "appreciations";

/**
 * Upsert sync_state : crée la ligne ou incrémente `version`.
 * À appeler après chaque INSERT ou UPDATE métier réussi.
 */
export const bumpVersion = async (
  env: ENV,
  table: SyncableTable,
  elementId: string,
  updatedBy: string,
  updatedAt: string = new Date().toISOString()
): Promise<number> => {
  const D1 = getDB(env);
  if (!D1) return 0;

  try {
    await D1.prepare(
      `INSERT INTO sync_state (table_name, element_id, version, updatedAt, updatedBy, deleted)
       VALUES (?, ?, 1, ?, ?, 0)
       ON CONFLICT(table_name, element_id) DO UPDATE SET
         version = version + 1,
         updatedAt = excluded.updatedAt,
         updatedBy = excluded.updatedBy,
         deleted = 0`
    )
      .bind(table, elementId, updatedAt, updatedBy)
      .run();

    const row = await D1.prepare(
      `SELECT version FROM sync_state WHERE table_name = ? AND element_id = ?`
    )
      .bind(table, elementId)
      .first<{ version: number }>();

    return row?.version ?? 0;
  } catch (e) {
    console.log("[sync_state] bumpVersion error:", table, elementId, e);
    return 0;
  }
};

/**
 * Marque une entité comme supprimée et incrémente la version.
 * Ne supprime PAS la ligne sync_state (tombstone nécessaire au pull).
 */
export const markDeleted = async (
  env: ENV,
  table: SyncableTable,
  elementId: string,
  updatedBy: string,
  updatedAt: string = new Date().toISOString()
): Promise<number> => {
  const D1 = getDB(env);
  if (!D1) return 0;

  try {
    await D1.prepare(
      `INSERT INTO sync_state (table_name, element_id, version, updatedAt, updatedBy, deleted)
       VALUES (?, ?, 1, ?, ?, 1)
       ON CONFLICT(table_name, element_id) DO UPDATE SET
         version = version + 1,
         updatedAt = excluded.updatedAt,
         updatedBy = excluded.updatedBy,
         deleted = 1`
    )
      .bind(table, elementId, updatedAt, updatedBy)
      .run();

    const row = await D1.prepare(
      `SELECT version FROM sync_state WHERE table_name = ? AND element_id = ?`
    )
      .bind(table, elementId)
      .first<{ version: number }>();

    return row?.version ?? 0;
  } catch (e) {
    console.log("[sync_state] markDeleted error:", table, elementId, e);
    return 0;
  }
};

/**
 * Récupère l'état courant d'une entité dans sync_state.
 */
export const getSyncState = async (
  env: ENV,
  table: SyncableTable,
  elementId: string
): Promise<{ version: number; updatedAt: string; updatedBy: string; deleted: number } | null> => {
  const D1 = getDB(env);
  if (!D1) return null;
  try {
    return await D1.prepare(
      `SELECT version, updatedAt, updatedBy, deleted FROM sync_state WHERE table_name = ? AND element_id = ?`
    )
      .bind(table, elementId)
      .first<{ version: number; updatedAt: string; updatedBy: string; deleted: number }>();
  } catch (e) {
    console.log("[sync_state] getSyncState error:", e);
    return null;
  }
};

/**
 * Arbitrage LWW (Last-Write-Wins).
 *
 * Comparaison :
 *  1. Si le serveur n'a pas encore d'état → le client gagne (premier écrit).
 *  2. Sinon, compare `updatedAt` (ISO string). Le plus récent gagne.
 *  3. En cas d'égalité de timestamp, l'`updatedBy` lexicographiquement plus grand gagne (tiebreaker stable).
 *
 * Renvoie :
 *  - `applied: "client"` → l'écriture client est acceptée, le serveur doit bumpVersion.
 *  - `applied: "server"` → l'état serveur l'emporte, le client doit adopter `currentVersion`.
 */
export type LWWDecision = {
  applied: "client" | "server";
  currentVersion: number;
  currentUpdatedAt: string;
  currentUpdatedBy: string;
};

export const arbitrateLWW = async (
  env: ENV,
  table: SyncableTable,
  elementId: string,
  clientUpdatedAt: string,
  clientUpdatedBy: string
): Promise<LWWDecision> => {
  const current = await getSyncState(env, table, elementId);

  if (!current) {
    return {
      applied: "client",
      currentVersion: 0,
      currentUpdatedAt: clientUpdatedAt,
      currentUpdatedBy: clientUpdatedBy,
    };
  }

  const clientWins =
    clientUpdatedAt > current.updatedAt ||
    (clientUpdatedAt === current.updatedAt && clientUpdatedBy > current.updatedBy);

  return {
    applied: clientWins ? "client" : "server",
    currentVersion: current.version,
    currentUpdatedAt: current.updatedAt,
    currentUpdatedBy: current.updatedBy,
  };
};

/**
 * Seed rétroactif : pour chaque table métier déjà peuplée, insère une ligne
 * sync_state version=1 si absente. Idempotent — peut être appelé à chaque cold-start.
 */
const SEEDABLE: Array<{ table: SyncableTable; tsColumn: string }> = [
  { table: "notes", tsColumn: "COALESCE(modified, created, datetime('now'))" },
  { table: "groupes", tsColumn: "COALESCE(modified, created, datetime('now'))" },
  { table: "articles", tsColumn: "COALESCE(updatedAt, createdAt, datetime('now'))" },
  { table: "publish", tsColumn: "COALESCE(updatedAt, createdAt, datetime('now'))" },
  { table: "comments", tsColumn: "COALESCE(modified, created, datetime('now'))" },
  { table: "appreciations", tsColumn: "datetime('now')" },
];

export const seedIfEmpty = async (env: ENV): Promise<{ seeded: number } | null> => {
  const D1 = getDB(env);
  if (!D1) return null;

  try {
    const countRow = await D1.prepare(`SELECT COUNT(*) as n FROM sync_state`).first<{ n: number }>();
    if ((countRow?.n ?? 0) > 0) {
      return { seeded: 0 };
    }

    let total = 0;
    for (const { table, tsColumn } of SEEDABLE) {
      try {
        const tableExists = await D1.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`
        )
          .bind(table)
          .first<{ name: string }>();
        if (!tableExists) continue;

        const res = await D1.prepare(
          `INSERT INTO sync_state (table_name, element_id, version, updatedAt, updatedBy, deleted)
           SELECT ?, id, 1, ${tsColumn}, 'bootstrap', 0
           FROM ${table}
           WHERE NOT EXISTS (
             SELECT 1 FROM sync_state s
             WHERE s.table_name = ? AND s.element_id = ${table}.id
           )`
        )
          .bind(table, table)
          .run();

        const inserted = res.meta?.changes ?? 0;
        total += inserted;
        console.log(`[sync_state seed] ${table}: ${inserted} rows`);
      } catch (e) {
        console.log(`[sync_state seed] ${table} failed:`, e);
      }
    }
    return { seeded: total };
  } catch (e) {
    console.log("[sync_state seed] global error:", e);
    return null;
  }
};

/**
 * Garde-fou pour ne lancer le seed qu'une seule fois par instance Worker.
 */
let seededOnce = false;
export const ensureSeed = async (env: ENV): Promise<void> => {
  if (seededOnce) return;
  seededOnce = true;
  await seedIfEmpty(env);
};
