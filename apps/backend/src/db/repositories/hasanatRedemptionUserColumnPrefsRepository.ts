import { hasanatRedemptionUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: hasanatRedemptionUserColumnPrefs as never,
});

export const getHasanatRedemptionUserColumnPrefs = repo.get;
export const setHasanatRedemptionUserColumnPrefs = repo.set;
export const replaceHasanatRedemptionUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
export const listAllHasanatRedemptionUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
