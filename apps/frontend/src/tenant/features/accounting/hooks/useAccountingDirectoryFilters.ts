import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

/** Directory filters and pagination SSOT for Accounting Work (journal + CoA). */
export function useAccountingDirectoryFilters() {
  const [entryListPage, setEntryListPage] = useState(1);
  const [accountListPage, setAccountListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [entrySearch, setEntrySearch] = useState('');
  const debouncedEntrySearch = useDebounce(entrySearch, 250);
  const [entryStatusFilter, setEntryStatusFilter] = useState('all');
  const [entryDateFrom, setEntryDateFrom] = useState('');
  const [entryDateTo, setEntryDateTo] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const debouncedAccountSearch = useDebounce(accountSearch, 250);
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');

  useEffect(() => {
    setEntryListPage(1);
  }, [debouncedEntrySearch, entryStatusFilter, entryDateFrom, entryDateTo, showDeleted]);

  useEffect(() => {
    setAccountListPage(1);
  }, [debouncedAccountSearch, accountTypeFilter]);

  const clearEntryFilters = useCallback(() => {
    setEntrySearch('');
    setEntryStatusFilter('all');
    setEntryDateFrom('');
    setEntryDateTo('');
  }, []);

  const clearAccountFilters = useCallback(() => {
    setAccountSearch('');
    setAccountTypeFilter('all');
  }, []);

  return {
    entryListPage,
    setEntryListPage,
    accountListPage,
    setAccountListPage,
    showDeleted,
    setShowDeleted,
    entrySearch,
    setEntrySearch,
    debouncedEntrySearch,
    entryStatusFilter,
    setEntryStatusFilter,
    entryDateFrom,
    setEntryDateFrom,
    entryDateTo,
    setEntryDateTo,
    clearEntryFilters,
    accountSearch,
    setAccountSearch,
    debouncedAccountSearch,
    accountTypeFilter,
    setAccountTypeFilter,
    clearAccountFilters,
  };
}
