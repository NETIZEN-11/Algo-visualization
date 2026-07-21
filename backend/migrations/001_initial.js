/**
 * Migration 001 — initial schema.
 *
 * The schemas live in `models/` and Mongoose creates their indexes on
 * connect. This migration is a placeholder that seeds a baseline
 * `migrations` collection row (if absent) so `migrate status` has
 * something to print.
 *
 * If you add a real data migration, do it here and bump to 002.
 */
export const up = async (_db) => {
  // Index on the migrations collection is created in the runner.
  // No data changes required for the v1 schema.
}

export const down = async (_db) => {
  // nothing to undo
}
