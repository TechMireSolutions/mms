import { JournalEntriesAdvancedMode } from '@/tenant/features/accounting/components/JournalEntriesAdvancedMode';
import { JournalEntriesSimpleMode } from '@/tenant/features/accounting/components/JournalEntriesSimpleMode';
import type { JournalEntriesProps } from '@/tenant/features/accounting/components/journalEntriesTypes';
import { useJournalEntriesController } from '@/tenant/features/accounting/components/useJournalEntriesController';

export type { JournalEntriesProps } from '@/tenant/features/accounting/components/journalEntriesTypes';

/**
 * JournalEntries Component
 *
 * Renders the main dashboard for accounting entries. Supports a simple mode
 * with quick actions and guided templates, as well as an advanced mode for double-entry bookkeeping.
 */
export function JournalEntries(props: JournalEntriesProps) {
  const {
    entries,
    accounts,
    fiscalYears,
    getColumnWidth,
    onColumnResize,
    columnCustomizer,
  } = props;

  const controller = useJournalEntriesController(props);

  if (controller.mode === 'simple') {
    return (
      <JournalEntriesSimpleMode
        mode={controller.mode}
        tab={controller.tab}
        modeTabs={controller.modeTabs}
        journalSubTabs={controller.journalSubTabs}
        entries={entries}
        accounts={accounts}
        fiscalYears={fiscalYears}
        canWrite={controller.canWrite}
        simpleModal={controller.simpleModal}
        nlInput={controller.nlInput}
        nlSuggestion={controller.nlSuggestion}
        onModeChange={controller.setMode}
        onTabChange={controller.setTab}
        onNlSubmit={controller.handleNlSubmit}
        onNlChange={controller.handleNlChange}
        onOpenPrefill={(prefillType) => controller.setSimpleModal({ prefillType })}
        onExportCsv={controller.exportCSV}
        onSave={controller.handleSave}
        onCloseSimpleModal={() => controller.setSimpleModal(null)}
      />
    );
  }

  return (
    <JournalEntriesAdvancedMode
      mode={controller.mode}
      modeTabs={controller.modeTabs}
      entries={entries}
      filteredEntries={controller.filtered}
      accounts={accounts}
      fiscalYears={fiscalYears}
      selectedIds={controller.selectedIds}
      allFilteredSelected={controller.allFilteredSelected}
      visibleColumns={{
        ref: controller.showRef,
        date: controller.showDate,
        description: controller.showDescription,
        tags: controller.showTags,
        debit: controller.showDebit,
        credit: controller.showCredit,
        status: controller.showStatus,
      }}
      journalStatusConfig={controller.journalStatusConfig}
      grandDebit={controller.grandDebit}
      grandCredit={controller.grandCredit}
      search={controller.search}
      statusFilter={controller.statusFilter}
      tagFilter={controller.tagFilter}
      dateFrom={controller.dateFrom}
      dateTo={controller.dateTo}
      showFilters={controller.showFilters}
      modal={controller.modal}
      selected={controller.selected}
      canWrite={controller.canWrite}
      canDelete={controller.canDelete}
      showDeleted={controller.showDeleted}
      columnCustomizer={columnCustomizer}
      renderEntryActions={controller.renderEntryActions}
      formatAmount={controller.formatAmount}
      onModeChange={controller.setMode}
      onSearchChange={controller.setSearch}
      onStatusFilterChange={controller.setStatusFilter}
      onTagFilterChange={controller.setTagFilter}
      onDateFromChange={controller.setDateFrom}
      onDateToChange={controller.setDateTo}
      onShowFiltersChange={controller.setShowFilters}
      onOpenNew={() => {
        controller.setSelected(null);
        controller.setModal('new');
      }}
      onBulkAction={() => {
        void controller.handleBulkAction();
      }}
      onExportCsv={controller.exportCSV}
      onToggleSelected={controller.toggleSelected}
      onToggleAll={controller.toggleAllFiltered}
      onSave={controller.handleSave}
      onCloseModal={() => {
        controller.setModal(null);
        controller.setSelected(null);
      }}
      onEditSelected={() => controller.setModal('edit')}
      onReverseSelected={() => {
        if (!controller.selected) return;
        void controller.handleReverse(controller.selected);
        controller.setModal(null);
        controller.setSelected(null);
      }}
      getColumnWidth={getColumnWidth}
      onColumnResize={onColumnResize}
    />
  );
}
