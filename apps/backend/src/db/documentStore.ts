/** Tenant JSON document store — collections, objects, and admin storage helpers. */
export { getQueryRows } from './documentStoreKeys.js';
export {
  getCollection,
  getCollectionForUpdate,
  saveCollection,
  type SaveCollectionOptions,
} from './documentStoreCollections.js';
export {
  getObject,
  saveObject,
  deleteObject,
} from './documentStoreObjects.js';
export {
  getAllData,
  listCollectionStorageNames,
  getCollectionByStorageName,
  deleteCollectionByStorageName,
  deleteObjectByStorageKey,
  listObjectStorageKeys,
  getObjectByStorageKey,
} from './documentStoreAdmin.js';
