/** Contact SQL aggregates — metrics, report analytics, widgets. */
export { buildProfileIncompleteSql } from './contactRepositoryAggregateHelpers.js';
export {
  aggregateContactsCommandMetrics,
  aggregateContactsReportAnalytics,
  aggregateContactsMonthlyCreatedCounts,
} from './contactRepositoryMetrics.js';
export { aggregateContactsWidgetQueries } from './contactRepositoryWidgets.js';
