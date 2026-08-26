import { contactUseCases } from './src/contacts/use-cases/contactUseCases.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { dbConnect, dbDisconnect } from './src/db/dbConnection.js';
import { loadServerConfig } from './src/config/serverConfig.js';
import { loadRequestTenantLocalStorage } from './src/lib/tenantContext.js';

const config = loadServerConfig();
await dbConnect(config);

const tenantCtx = loadRequestTenantLocalStorage();
await tenantCtx.run('techmiresolutions', async () => {
  try {
    const page = await contactUseCases.loadContactDuplicatePairsPage({ page: 1, limit: 50 });
    console.log("Success pairCount:", page.pairs.length);
  } catch (err) {
    console.error("Caught error:", err);
  }
});
await dbDisconnect();
