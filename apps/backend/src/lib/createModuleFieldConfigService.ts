import { getRequestTenant } from './tenantContext.js';
import {
  mapCustomTabRowToFormTabFields,
  mergeFormTabsFromCustomTabs,
} from '../services/mergeFormTabsFromCustomTabs.js';
import { broadcastCollection } from './livePush.js';

type CustomTabRow = Parameters<typeof mapCustomTabRowToFormTabFields>[0];

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

/**
 * Shared field-config load/save: tenant → load → merge custom_tabs → strip on save → reload → broadcast.
 */
export function createModuleFieldConfigService<
  TRaw,
  TDocument extends { formTabs?: TFormTab[]; fields?: unknown },
  TFormTab,
  TFields,
  TPersist,
>({
  moduleId,
  broadcastKey,
  getByWorkspace,
  upsert,
  mapRow,
  merge,
  toDocument,
  stripForPersist,
  reloadFailedMessage,
}: {
  moduleId: string;
  broadcastKey: string;
  getByWorkspace: (tenant: string) => Promise<TRaw | null | undefined>;
  upsert: (tenant: string, payload: TPersist) => Promise<unknown>;
  mapRow: (row: CustomTabRow) => TFormTab;
  merge: (
    documentFormTabs: TFormTab[] | undefined,
    customFormTabs: TFormTab[],
    fields: TFields,
  ) => TFormTab[];
  toDocument: (raw: TRaw, tenant: string) => TDocument | Promise<TDocument>;
  stripForPersist: (config: TDocument) => TPersist;
  reloadFailedMessage: string;
}) {
  async function load(): Promise<(TDocument & { formTabs: TFormTab[] }) | null> {
    const tenant = requireTenant();
    const raw = await getByWorkspace(tenant);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const document = await toDocument(raw, tenant);
    const formTabs = await mergeFormTabsFromCustomTabs({
      moduleId,
      documentFormTabs: document.formTabs,
      fields: document.fields as TFields,
      mapRow,
      merge,
    });
    return { ...document, formTabs };
  }

  async function save(config: TDocument): Promise<TDocument & { formTabs: TFormTab[] }> {
    const tenant = requireTenant();
    await upsert(tenant, stripForPersist(config));
    const loaded = await load();
    if (!loaded) throw new Error(reloadFailedMessage);
    await broadcastCollection(broadcastKey);
    return loaded;
  }

  return { load, save, requireTenant };
}

export { mapCustomTabRowToFormTabFields, requireTenant as requireFieldConfigTenant };
