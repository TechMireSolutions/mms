import { describe, expect, it } from 'vitest';
import { resolveBackendRoot } from '../config/loadEnv.js';

describe('loadBackendEnv', () => {
  it('resolveBackendRoot points at apps/backend', () => {
    expect(resolveBackendRoot()).toMatch(/apps\/backend$/);
  });
});
