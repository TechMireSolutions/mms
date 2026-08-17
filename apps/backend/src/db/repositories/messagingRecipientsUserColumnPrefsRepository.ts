import { messagingRecipientsUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: messagingRecipientsUserColumnPrefs as never,
});

export const getMessagingRecipientsUserColumnPrefs = repo.get;
export const setMessagingRecipientsUserColumnPrefs = repo.set;
export const replaceMessagingRecipientsUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
export const listAllMessagingRecipientsUserColumnPrefsByWorkspace = repo.listAllByWorkspace;