import { contactUseCases } from './src/contacts/use-cases/contactUseCases.js';
import { AsyncLocalStorage } from 'node:async_hooks';

const tenantCtx = new AsyncLocalStorage();
tenantCtx.run('techmiresolutions', async () => {
  try {
    const page = await contactUseCases.loadContactDuplicatePairsPage({ page: 1, limit: 50 });
    console.log("Success", page);
  } catch (err) {
    console.error("Caught error:", err);
  }
});
