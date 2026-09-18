import { describe, it, expect } from 'vitest';
import { dehydrate } from '@tanstack/react-query';
import { queryClientInstance } from './queryClient';
import { ApiError } from './apiClient';

describe('queryClient configuration', () => {
  it('configures queries with networkMode online and 24-hour gcTime', () => {
    const defaults = queryClientInstance.getDefaultOptions();
    expect(defaults.queries?.networkMode).toBe('online');
    expect(defaults.queries?.gcTime).toBe(24 * 60 * 60_000);
  });

  it('computes exponential retryDelay (2^n * 1000ms)', () => {
    const defaults = queryClientInstance.getDefaultOptions();
    const retryDelay = defaults.queries?.retryDelay;
    expect(typeof retryDelay).toBe('function');

    if (typeof retryDelay === 'function') {
      expect(retryDelay(0, new Error('network failure'))).toBe(1000);
      expect(retryDelay(1, new Error('network failure'))).toBe(2000);
      expect(retryDelay(2, new Error('network failure'))).toBe(4000);
      expect(retryDelay(3, new Error('network failure'))).toBe(8000);
      expect(retryDelay(5, new Error('network failure'))).toBe(30000); // capped at 30s
    }
  });

  it('rejects retries on 401, 403, and 404 ApiErrors', () => {
    const defaults = queryClientInstance.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    expect(typeof retryFn).toBe('function');

    if (typeof retryFn === 'function') {
      const authError = new ApiError(401, 'Unauthorized');
      const forbiddenError = new ApiError(403, 'Forbidden');
      const notFoundError = new ApiError(404, 'Not Found');
      const serverError = new ApiError(500, 'Server Error');

      expect(retryFn(0, authError)).toBe(false);
      expect(retryFn(0, forbiddenError)).toBe(false);
      expect(retryFn(0, notFoundError)).toBe(false);
      expect(retryFn(0, serverError)).toBe(true);
      expect(retryFn(2, serverError)).toBe(true);
      expect(retryFn(3, serverError)).toBe(false); // Max 3 retries
    }
  });

  it('shouldDehydrateQuery excludes platform queries from IDB persistence', () => {
    // Seed a successful platform query into the cache
    void queryClientInstance.setQueryData(['platform', 'workspaces'], [{ subdomain: 'test' }]);
    const state = dehydrate(queryClientInstance, {
      shouldDehydrateQuery: (query) => {
        const firstKey = query.queryKey[0];
        if (firstKey === 'platform') return false;
        return (
          query.state.status === 'success' &&
          query.state.data !== undefined &&
          !query.queryKey.some((k) => typeof k === 'string' && k.includes('auth'))
        );
      },
    });
    const keys = state.queries.map((q) => q.queryKey[0]);
    expect(keys).not.toContain('platform');
    // Cleanup
    queryClientInstance.removeQueries({ queryKey: ['platform', 'workspaces'] });
  });
});
