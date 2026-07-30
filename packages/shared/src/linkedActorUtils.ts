import {
  normalizeIdLinkedName,
  resolveEntityName,
  type NamedEntity,
} from './contactLinkPolicy.js';

/** Strips a denormalized actor label when the workspace user id is set. */
export function normalizeUserActorField<T extends Record<string, unknown>>(
  row: T,
  userIdField: string,
  labelField: string,
): T {
  if (!row || typeof row !== "object") return row;
  return normalizeIdLinkedName(row, userIdField, labelField);
}

/** Hydrates an actor display label from workspace users. */
export function hydrateUserActorField<T extends Record<string, unknown>>(
  row: T,
  userIdField: string,
  labelField: string,
  users: NamedEntity[],
): T {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    [labelField]: resolveEntityName(row[userIdField] as string | number, users) || row[labelField],
  };
}
