import { ERD_DOMAIN_ATTENDANCE, ERD_DOMAIN_ENROLLMENTS, ERD_DOMAIN_SESSIONS } from './erdDomainsAcademics.js';
import { ERD_DOMAIN_EXAMINATIONS, ERD_DOMAIN_QUESTION_BANK } from './erdDomainsAssessments.js';
import { ERD_DOMAIN_HASANAT, ERD_DOMAIN_OBLIGATIONS } from './erdDomainsFaith.js';
import { ERD_DOMAIN_ACCOUNTING, ERD_DOMAIN_FINANCE } from './erdDomainsFinance.js';
import {
  ERD_DOMAIN_CHARITY,
  ERD_DOMAIN_INVENTORY,
  ERD_DOMAIN_MESSAGING,
  ERD_DOMAIN_WORKSHOPS,
} from './erdDomainsOps.js';
import { ERD_DOMAIN_CONTACTS, ERD_DOMAIN_STUDENTS, ERD_DOMAIN_TEACHERS } from './erdDomainsPeople.js';
import { ERD_DOMAIN_PLATFORM, ERD_DOMAIN_SYSTEM } from './erdDomainsPlatform.js';
import type { ErdDomain, ErdDomainId } from './erdCatalogTypes.js';

export type { ErdColumn, ErdColumnKind, ErdDomain, ErdDomainId, ErdRelationship, ErdTable } from './erdCatalogTypes.js';
export { ERD_DOMAIN_IDS } from './erdCatalogTypes.js';
export {
  buildErdMermaid,
  filterErdDomainByTable,
  isErdDomainId,
  listErdTableNames,
  mermaidErdToken,
} from './erdCatalogHelpers.js';

/**
 * Domain-separated ERDs aligned with Drizzle schema modules.
 * Tenant tables share a composite key of `(workspace_subdomain, id)` unless noted.
 */
export const ERD_DOMAINS: readonly ErdDomain[] = [
  ERD_DOMAIN_ACCOUNTING,
  ERD_DOMAIN_ATTENDANCE,
  ERD_DOMAIN_CHARITY,
  ERD_DOMAIN_CONTACTS,
  ERD_DOMAIN_ENROLLMENTS,
  ERD_DOMAIN_EXAMINATIONS,
  ERD_DOMAIN_FINANCE,
  ERD_DOMAIN_HASANAT,
  ERD_DOMAIN_INVENTORY,
  ERD_DOMAIN_MESSAGING,
  ERD_DOMAIN_OBLIGATIONS,
  ERD_DOMAIN_PLATFORM,
  ERD_DOMAIN_QUESTION_BANK,
  ERD_DOMAIN_SESSIONS,
  ERD_DOMAIN_STUDENTS,
  ERD_DOMAIN_SYSTEM,
  ERD_DOMAIN_TEACHERS,
  ERD_DOMAIN_WORKSHOPS,
];

const ERD_DOMAIN_BY_ID = new Map<ErdDomainId, ErdDomain>(
  ERD_DOMAINS.map((domain) => [domain.id, domain]),
);

/** Look up a domain ERD by id. */
export function getErdDomain(id: ErdDomainId): ErdDomain {
  const domain = ERD_DOMAIN_BY_ID.get(id);
  if (!domain) {
    throw new Error(`Unknown ERD domain: ${id}`);
  }
  return domain;
}
