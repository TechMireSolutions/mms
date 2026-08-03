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

describe('loadServerConfig PG tenant tx budgets', () => {
  const previous = {
    statement: process.env.PG_STATEMENT_TIMEOUT_MS,
    idle: process.env.PG_IDLE_IN_TX_TIMEOUT_MS,
    request: process.env.REQUEST_TIMEOUT_MS,
  };

  afterEach(() => {
    restoreEnv('PG_STATEMENT_TIMEOUT_MS', previous.statement);
    restoreEnv('PG_IDLE_IN_TX_TIMEOUT_MS', previous.idle);
    restoreEnv('REQUEST_TIMEOUT_MS', previous.request);
  });

  it('defaults statement and idle-in-tx timeouts under request timeout', () => {
    delete process.env.PG_STATEMENT_TIMEOUT_MS;
    delete process.env.PG_IDLE_IN_TX_TIMEOUT_MS;
    delete process.env.REQUEST_TIMEOUT_MS;
    const config = loadServerConfig();
    expect(config.pgStatementTimeoutMs).toBe(30_000);
    expect(config.pgIdleInTxTimeoutMs).toBe(15_000);
    expect(config.pgIdleInTxTimeoutMs).toBeLessThanOrEqual(config.pgStatementTimeoutMs);
    expect(config.pgStatementTimeoutMs).toBeLessThanOrEqual(config.requestTimeoutMs);
  });

  it('caps statement timeout by request timeout and idle by statement', () => {
    process.env.REQUEST_TIMEOUT_MS = '20000';
    process.env.PG_STATEMENT_TIMEOUT_MS = '60000';
    process.env.PG_IDLE_IN_TX_TIMEOUT_MS = '45000';
    const config = loadServerConfig();
    expect(config.requestTimeoutMs).toBe(20_000);
    expect(config.pgStatementTimeoutMs).toBe(20_000);
    expect(config.pgIdleInTxTimeoutMs).toBe(20_000);
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
