export {
  closeDatabase,
  getPool,
  getPoolMetrics,
  initializeDatabaseConnection,
  pingDatabase,
  runInReadSnapshotTransaction,
  runInTransaction,
  type PoolMetrics,
} from './dbConnection.js';

export async function getDatabaseHealth() {
  const { pingDatabase, getPoolMetrics } = await import('./dbConnection.js');
  const isConnected = await pingDatabase();
  const poolMetrics = getPoolMetrics();
  return {
    status: isConnected ? 'healthy' : 'unhealthy',
    pool: poolMetrics,
  };
}
export {
  deleteCollectionByStorageName,
  deleteCollection,
  deleteObject,
  deleteObjectByStorageKey,
  getAllData,
  getCollection,
  getCollectionByStorageName,
  getCollectionForUpdate,
  getObject,
  getObjectByStorageKey,
  listCollectionStorageNames,
  listObjectStorageKeys,
  listTenantObjectLogicalKeys,
  listTenantCollectionLogicalKeys,
  saveCollection,
  saveObject,
  type SaveCollectionOptions,
} from './documentStore.js';
export { initDb, seedDatabase } from './dbInit.js';
export {
  purgeTenantDataBySubdomain,
  resetDatabase,
  resetTenantData,
} from './dbPurge.js';
