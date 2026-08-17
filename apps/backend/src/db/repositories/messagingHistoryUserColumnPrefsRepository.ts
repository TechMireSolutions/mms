import { messagingHistoryUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: messagingHistoryUserColumnPrefs as never,
});

export const getMessagingHistoryUserColumnPrefs = repo.get;
export const setMessagingHistoryUserColumnPrefs = repo.set;
export const replaceMessagingHistoryUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
export const listAllMessagingHistoryUserColumnPrefsByWorkspace = repo.listAllByWorkspace;