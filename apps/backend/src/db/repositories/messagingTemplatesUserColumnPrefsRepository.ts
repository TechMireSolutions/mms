import { messagingTemplatesUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: messagingTemplatesUserColumnPrefs as never,
});

export const getMessagingTemplatesUserColumnPrefs = repo.get;
export const setMessagingTemplatesUserColumnPrefs = repo.set;
export const replaceMessagingTemplatesUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
export const listAllMessagingTemplatesUserColumnPrefsByWorkspace = repo.listAllByWorkspace;