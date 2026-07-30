import { useEffect, useRef, useState } from 'react';
import { getCollection, getObject, hasCollectionInCache, saveCollectionCacheOnly } from '@/lib/db';
import { apiFetch } from '@/lib/apiClient';


// Helper hook to fetch multiple collections and objects in a single React state & effect.
// Avoids dynamic loop hook calls, completely adhering to the rules of hooks.
export function useLiveCollectionsAndObjects(
  collections?: Record<string, { dbKey: string; default: () => unknown[] }>,
  objects?: Record<string, { dbKey: string; default: () => unknown }>,
) {
  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;
  const objectsRef = useRef(objects);
  objectsRef.current = objects;

  const [state, setState] = useState(() => {
    const initialCollections: Record<string, unknown[]> = {};
    const initialObjects: Record<string, unknown> = {};

    if (collections) {
      for (const [key, conf] of Object.entries(collections)) {
        initialCollections[key] = getCollection(conf.dbKey, conf.default());
      }
    }
    if (objects) {
      for (const [key, conf] of Object.entries(objects)) {
        initialObjects[key] = getObject(conf.dbKey, conf.default());
      }
    }

    return { collections: initialCollections, objects: initialObjects };
  });

  useEffect(() => {
    if (!collectionsRef.current && !objectsRef.current) return;

    const handleUpdate = (): void => {
      setState(() => {
        const nextCollections: Record<string, unknown[]> = {};
        const nextObjects: Record<string, unknown> = {};

        if (collectionsRef.current) {
          for (const [key, conf] of Object.entries(collectionsRef.current)) {
            nextCollections[key] = getCollection(conf.dbKey, conf.default());
          }
        }
        if (objectsRef.current) {
          for (const [key, conf] of Object.entries(objectsRef.current)) {
            nextObjects[key] = getObject(conf.dbKey, conf.default());
          }
        }

        return { collections: nextCollections, objects: nextObjects };
      });
    };

    handleUpdate();

    const isAuth = typeof window !== 'undefined' && localStorage.getItem('mms_user') !== null;
    if (isAuth && collectionsRef.current) {
      for (const conf of Object.values(collectionsRef.current)) {
        if (!hasCollectionInCache(conf.dbKey)) {
          apiFetch(`/api/db/collections/${conf.dbKey}`)
            .then(async (res) => {
              if (res.ok) {
                const fetched = (await res.json()) as unknown[];
                saveCollectionCacheOnly(conf.dbKey, fetched);
              }
            })
            .catch((error) => {
              console.error(`Error fetching collection "${conf.dbKey}" on-demand:`, error);
            });
        }
      }
    }

    window.addEventListener('local-database-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('local-database-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return state;
}
