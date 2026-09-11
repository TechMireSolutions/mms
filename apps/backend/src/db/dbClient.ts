import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';

let _db: NodePgDatabase<typeof schema> | null = null;

function applySoftDeleteGuardrailsToWith(withOption: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(withOption)) {
    if (value === true) {
      result[key] = {
        where: (relation: any, { isNull }: any) =>
          relation && typeof relation === 'object' && 'deletedAt' in relation
            ? isNull(relation.deletedAt)
            : undefined,
      };
    } else if (typeof value === 'object' && value !== null) {
      const copy = { ...value };
      if (!copy.where) {
        copy.where = (relation: any, { isNull }: any) =>
          relation && typeof relation === 'object' && 'deletedAt' in relation
            ? isNull(relation.deletedAt)
            : undefined;
      } else {
        const origWhere = copy.where;
        copy.where = (relation: any, helpers: any) => {
          const userCond = origWhere(relation, helpers);
          if (relation && typeof relation === 'object' && 'deletedAt' in relation && helpers?.isNull) {
            return userCond
              ? helpers.and
                ? helpers.and(userCond, helpers.isNull(relation.deletedAt))
                : userCond
              : helpers.isNull(relation.deletedAt);
          }
          return userCond;
        };
      }
      if (copy.with && typeof copy.with === 'object') {
        copy.with = applySoftDeleteGuardrailsToWith(copy.with);
      }
      result[key] = copy;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function wrapDbWithRelationalGuardrails<TDb extends object>(dbInstance: TDb): TDb {
  if (!dbInstance || typeof dbInstance !== 'object') return dbInstance;
  const originalQuery = (dbInstance as any).query;
  if (!originalQuery) return dbInstance;

  const queryProxy = new Proxy(originalQuery, {
    get(target, tableKey, receiver) {
      const tableQuery = Reflect.get(target, tableKey, receiver);
      if (!tableQuery || typeof tableQuery !== 'object') return tableQuery;

      return new Proxy(tableQuery, {
        get(tableTarget, methodKey, tableReceiver) {
          const origMethod = Reflect.get(tableTarget, methodKey, tableReceiver);
          if (typeof origMethod !== 'function') return origMethod;
          if (methodKey !== 'findFirst' && methodKey !== 'findMany') return origMethod;

          return function (options?: any) {
            if (options && options.with && typeof options.with === 'object') {
              options = {
                ...options,
                with: applySoftDeleteGuardrailsToWith(options.with),
              };
            }
            return origMethod.call(tableTarget, options);
          };
        },
      });
    },
  });

  return new Proxy(dbInstance, {
    get(target, prop, receiver) {
      if (prop === 'query') {
        return queryProxy;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export function setDb(instance: NodePgDatabase<typeof schema> | null): void {
  _db = instance ? wrapDbWithRelationalGuardrails(instance) : null;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    throw new Error('Database not initialized');
  }
  return _db;
}
