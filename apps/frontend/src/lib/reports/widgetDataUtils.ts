/** Widget collection snapshots, aggregate readers, and value/chart compute. */
export {
  getWidgetCollections,
  getFilteredRecords,
} from "./widgetCollectionSnapshot.js";
export {
  computeWidgetSingleValue,
  computeWidgetChartData,
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
} from "./widgetValueCompute.js";
