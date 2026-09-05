import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import { is } from 'drizzle-orm';
import type {
  AppTranslationKey,
  ErdColumn,
  ErdDomain,
  ErdDomainId,
  ErdRelationship,
  ErdTable,
  PlatformErdResponse,
} from '@mms/shared';

// Import Drizzle schema modules
import * as platformSchema from '../../db/schema/platform.js';
import * as systemSchema from '../../db/schema/system.js';
import * as contactsSchema from '../../db/schema/contacts.js';
import * as studentsSchema from '../../db/schema/students.js';
import * as teachersSchema from '../../db/schema/teachers.js';
import * as sessionsSchema from '../../db/schema/sessions.js';
import * as attendanceSchema from '../../db/schema/attendance.js';
import * as enrollmentsSchema from '../../db/schema/enrollments.js';
import * as financeSchema from '../../db/schema/finance.js';
import * as financeBillingSchema from '../../db/schema/financeBilling.js';
import * as financeCollectSchema from '../../db/schema/financeCollect.js';
import * as accountingSchema from '../../db/schema/accounting.js';
import * as accountingLedgerOpsSchema from '../../db/schema/accountingLedgerOps.js';
import * as examinationExamSchema from '../../db/schema/examinationExamTables.js';
import * as examinationQuestionBankSchema from '../../db/schema/examinationQuestionBankTables.js';
import * as obligationsSchema from '../../db/schema/obligations.js';
import * as hasanatSchema from '../../db/schema/hasanat.js';
import * as messagingSchema from '../../db/schema/messaging.js';
import * as inventorySchema from '../../db/schema/inventory.js';
import * as charitySchema from '../../db/schema/charity.js';
import * as workshopsSchema from '../../db/schema/workshops.js';

interface DomainConfig {
  id: ErdDomainId;
  labelKey: AppTranslationKey;
  modules: readonly Record<string, unknown>[];
}

const DOMAIN_REGISTRY: readonly DomainConfig[] = [
  {
    id: 'accounting',
    labelKey: 'nav.accounting',
    modules: [accountingSchema, accountingLedgerOpsSchema],
  },
  {
    id: 'attendance',
    labelKey: 'nav.attendance',
    modules: [attendanceSchema],
  },
  {
    id: 'charity',
    labelKey: 'platform.erdDomainCharity',
    modules: [charitySchema],
  },
  {
    id: 'contacts',
    labelKey: 'nav.contacts',
    modules: [contactsSchema],
  },
  {
    id: 'enrollments',
    labelKey: 'nav.enrollments',
    modules: [enrollmentsSchema],
  },
  {
    id: 'examinations',
    labelKey: 'nav.examinations',
    modules: [examinationExamSchema],
  },
  {
    id: 'finance',
    labelKey: 'nav.finance',
    modules: [financeSchema, financeBillingSchema, financeCollectSchema],
  },
  {
    id: 'hasanat',
    labelKey: 'nav.hasanatCards',
    modules: [hasanatSchema],
  },
  {
    id: 'inventory',
    labelKey: 'platform.erdDomainInventory',
    modules: [inventorySchema],
  },
  {
    id: 'messaging',
    labelKey: 'nav.messaging',
    modules: [messagingSchema],
  },
  {
    id: 'obligations',
    labelKey: 'nav.obligations',
    modules: [obligationsSchema],
  },
  {
    id: 'platform',
    labelKey: 'platform.erdDomainPlatform',
    modules: [platformSchema],
  },
  {
    id: 'questionBank',
    labelKey: 'nav.questionBank',
    modules: [examinationQuestionBankSchema],
  },
  {
    id: 'sessions',
    labelKey: 'nav.sessions',
    modules: [sessionsSchema],
  },
  {
    id: 'students',
    labelKey: 'nav.students',
    modules: [studentsSchema],
  },
  {
    id: 'system',
    labelKey: 'platform.erdDomainSystem',
    modules: [systemSchema],
  },
  {
    id: 'teachers',
    labelKey: 'nav.teachers',
    modules: [teachersSchema],
  },
  {
    id: 'workshops',
    labelKey: 'platform.erdDomainWorkshops',
    modules: [workshopsSchema],
  },
];

interface IntrospectedTableResult {
  table: ErdTable;
  relationships: ErdRelationship[];
}

function introspectPgTable(table: PgTable): IntrospectedTableResult {
  const cfg = getTableConfig(table);

  const pkNames = new Set<string>();
  for (const pk of cfg.primaryKeys) {
    for (const c of pk.columns) pkNames.add(c.name);
  }

  const fkNames = new Set<string>();
  const relationships: ErdRelationship[] = [];

  for (const fk of cfg.foreignKeys) {
    const ref = fk.reference();
    for (const c of ref.columns) fkNames.add(c.name);

    const fromColumn = ref.columns[0]?.name || '';
    const foreignTableCfg = getTableConfig(ref.foreignTable);
    const toTable = foreignTableCfg.name;
    const toColumn = ref.foreignColumns[0]?.name || '';

    // Determine cardinality: if fromColumn is primary or unique -> 1:1, else N:1
    const isOneToOne = ref.columns.every((c) => c.primary || pkNames.has(c.name));

    relationships.push({
      fromTable: cfg.name,
      fromColumn,
      toTable,
      toColumn,
      cardinality: isOneToOne ? '1:1' : 'N:1',
      onDelete:
        fk.onDelete === 'cascade' || fk.onDelete === 'set null' ? fk.onDelete : undefined,
    });
  }

  const uniqueNames = new Set<string>();
  for (const u of cfg.uniqueConstraints) {
    for (const c of u.columns) uniqueNames.add(c.name);
  }
  for (const idx of cfg.indexes) {
    if (idx.config.unique) {
      for (const col of idx.config.columns) {
        if (col && 'name' in col && typeof col.name === 'string') {
          uniqueNames.add(col.name);
        }
      }
    }
  }

  const columns: ErdColumn[] = cfg.columns.map((c) => {
    let kind: ErdColumn['kind'] = 'column';
    if (c.primary || pkNames.has(c.name)) {
      kind = 'pk';
    } else if (fkNames.has(c.name)) {
      kind = 'fk';
    } else if (c.isUnique || uniqueNames.has(c.name)) {
      kind = 'unique';
    }

    return {
      name: c.name,
      type: c.getSQLType(),
      kind,
    };
  });

  return {
    table: {
      name: cfg.name,
      columns,
    },
    relationships,
  };
}

let cachedResponse: PlatformErdResponse | null = null;

/**
 * Dynamically introspects all active Drizzle tables across domain modules.
 * Automatically generates the ErdDomain catalog, columns, and foreign-key edges.
 */
export function getIntrospectedErdDomains(): PlatformErdResponse {
  if (cachedResponse) {
    return cachedResponse;
  }

  const allTablesByName = new Map<string, ErdTable>();
  const allRelationshipsByFromTable = new Map<string, ErdRelationship[]>();

  // Collect and introspect every PgTable exported in any registered module
  for (const domain of DOMAIN_REGISTRY) {
    for (const mod of domain.modules) {
      for (const value of Object.values(mod)) {
        if (is(value, PgTable)) {
          const { table, relationships } = introspectPgTable(value as PgTable);
          if (!allTablesByName.has(table.name)) {
            allTablesByName.set(table.name, table);
            allRelationshipsByFromTable.set(table.name, relationships);
          }
        }
      }
    }
  }

  const domains: ErdDomain[] = DOMAIN_REGISTRY.map((config) => {
    const domainTables = new Map<string, ErdTable>();
    const domainRelationships: ErdRelationship[] = [];

    // Extract tables declared in this domain's modules
    for (const mod of config.modules) {
      for (const value of Object.values(mod)) {
        if (is(value, PgTable)) {
          const cfg = getTableConfig(value as PgTable);
          const table = allTablesByName.get(cfg.name);
          if (table && !domainTables.has(table.name)) {
            domainTables.set(table.name, table);
          }
        }
      }
    }

    // Process relationships for tables in this domain
    for (const tableName of domainTables.keys()) {
      const rels = allRelationshipsByFromTable.get(tableName) || [];
      for (const rel of rels) {
        // Skip default multi-tenant partition key link unless platform domain
        if (rel.fromColumn === 'workspace_subdomain' && config.id !== 'platform') {
          continue;
        }

        // If target table exists in monorepo, include it in domain if missing
        // (e.g. students linking to contacts)
        if (allTablesByName.has(rel.toTable) && !domainTables.has(rel.toTable)) {
          const targetTable = allTablesByName.get(rel.toTable)!;
          domainTables.set(targetTable.name, targetTable);
        }

        // Keep relationship if both endpoints are present in this domain
        if (domainTables.has(rel.fromTable) && domainTables.has(rel.toTable)) {
          domainRelationships.push(rel);
        }
      }
    }

    // Sort tables by name for deterministic order
    const sortedTables = Array.from(domainTables.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return {
      id: config.id,
      labelKey: config.labelKey,
      tables: sortedTables,
      relationships: domainRelationships,
    };
  });

  cachedResponse = {
    success: true,
    domains,
    totalTables: allTablesByName.size,
    generatedAt: new Date().toISOString(),
  };

  return cachedResponse;
}

/** Clear cache during testing or hot reload. */
export function resetIntrospectedErdCache(): void {
  cachedResponse = null;
}
