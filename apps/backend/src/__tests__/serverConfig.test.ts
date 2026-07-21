import { afterEach, describe, expect, it } from 'vitest';
import { loadServerConfig } from '../config/serverConfig.js';

describe('loadServerConfig proxy trust', () => {
  const previousTrustProxy = process.env.TRUST_PROXY;

  afterEach(() => {
    if (previousTrustProxy === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = previousTrustProxy;
    }
  });

  it('does not trust forwarding headers by default', () => {
    delete process.env.TRUST_PROXY;
    expect(loadServerConfig().trustProxy).toBe(false);
  });

  it('supports explicitly disabling proxy trust', () => {
    process.env.TRUST_PROXY = 'false';
    expect(loadServerConfig().trustProxy).toBe(false);
  });

  it('accepts an explicit comma-separated trusted proxy list', () => {
    process.env.TRUST_PROXY = '127.0.0.1, 10.0.0.0/8';
    expect(loadServerConfig().trustProxy).toEqual(['127.0.0.1', '10.0.0.0/8']);
  });

  it('rejects a trust-all configuration', () => {
    process.env.TRUST_PROXY = 'true';
    expect(() => loadServerConfig()).toThrow('TRUST_PROXY=true is unsafe');
  });
});
