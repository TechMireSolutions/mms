import { hasanatDistributionUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: hasanatDistributionUserColumnPrefs as never,
});

export const getHasanatDistributionUserColumnPrefs = repo.get;
export const setHasanatDistributionUserColumnPrefs = repo.set;
export const replaceHasanatDistributionUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
export const listAllHasanatDistributionUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
