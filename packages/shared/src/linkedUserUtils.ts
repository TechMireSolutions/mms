import {
  hydrateContactProfile,
  normalizeContactLinkedRecord,
  normalizeIdLinkedName,
  resolveEntityName,
  type ContactLike,
  type NamedEntity,
} from './contactLinkPolicy.js';

export function stripWorkspaceUserProfileFields<T extends Record<string, unknown>>(user: T): T {
  if (!user || typeof user !== "object") return user;
  return normalizeContactLinkedRecord(user);
}

export function hydrateWorkspaceUserProfile<T extends Record<string, unknown>>(
  user: T,
  contacts: ContactLike[],
): T {
  if (!user || typeof user !== "object") return user;
  const hydrated = hydrateContactProfile(user, contacts);
  const name = String(hydrated.name ?? '');
  if (name && !hydrated.avatarInitials) {
    return {
      ...hydrated,
      avatarInitials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    };
  }
  return hydrated;
}

export function normalizeActivityLog<T extends Record<string, unknown>>(log: T): T {
  if (!log || typeof log !== "object") return log;
  return normalizeIdLinkedName(log, 'userId', 'userName');
}

export function hydrateActivityLog<T extends Record<string, unknown>>(
  log: T,
  users: NamedEntity[],
): T {
  if (!log || typeof log !== "object") return log;
  return {
    ...log,
    userName: resolveEntityName(log.userId as string | number, users) || log.userName,
  };
}
