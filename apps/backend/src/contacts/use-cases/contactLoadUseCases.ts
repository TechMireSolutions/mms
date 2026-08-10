/**
 * Load use cases — stable seam kept as a barrel over the entity + aggregate splits.
 *
 * Entity reads (`countContacts`, paging, by-ids, by-id) live in
 * `contactLoadEntityUseCases.ts`; SQL aggregate/report loads live in
 * `contactLoadAggregateUseCases.ts`. The composition root and
 * `contactDuplicateScanService` import this path, so it stays a re-export.
 */
export * from './contactLoadEntityUseCases.js';
export * from './contactLoadAggregateUseCases.js';
