import { useSearchParams } from 'react-router-dom';
import {
  ERD_DOMAINS,
  filterErdDomainByTable,
  getErdDomain,
  isErdDomainId,
  listErdTableNames,
  type ErdDomain,
  type ErdDomainId,
} from '@mms/shared';

const DEFAULT_DOMAIN: ErdDomainId = 'accounting';
const ALL_TABLES = '';

export function useErdPageController(): {
  domainId: ErdDomainId;
  focusTable: string;
  domain: ErdDomain;
  visible: ErdDomain;
  tableNames: string[];
  setDomainId: (id: string) => void;
  setFocusTable: (table: string) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDomain = searchParams.get('domain') ?? DEFAULT_DOMAIN;
  const domainId = isErdDomainId(rawDomain) ? rawDomain : DEFAULT_DOMAIN;
  const domain = getErdDomain(domainId);
  const tableNames = listErdTableNames(domain.tables);
  const requestedTable = searchParams.get('table') ?? ALL_TABLES;
  const focusTable = tableNames.includes(requestedTable) ? requestedTable : ALL_TABLES;
  const visible = focusTable ? filterErdDomainByTable(domain, focusTable) : domain;

  const replaceParams = (nextDomain: ErdDomainId, nextTable: string): void => {
    const next = new URLSearchParams(searchParams);
    next.set('domain', nextDomain);
    if (nextTable) {
      next.set('table', nextTable);
    } else {
      next.delete('table');
    }
    setSearchParams(next, { replace: true });
  };

  return {
    domainId,
    focusTable,
    domain,
    visible,
    tableNames,
    setDomainId: (id) => {
      replaceParams(isErdDomainId(id) ? id : DEFAULT_DOMAIN, ALL_TABLES);
    },
    setFocusTable: (table) => {
      replaceParams(domainId, table);
    },
  };
}

export const ERD_DOMAIN_OPTIONS = ERD_DOMAINS.map((item) => ({
  value: item.id,
  labelKey: item.labelKey,
}));
