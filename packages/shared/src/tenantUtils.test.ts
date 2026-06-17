import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APP_DOMAIN,
  inferAppDomainFromHostname,
  parseTenantFromHost,
  resolveAppDomain,
} from './tenantUtils.js';

describe('inferAppDomainFromHostname', () => {
  it('returns localhost for dev hosts', () => {
    expect(inferAppDomainFromHostname('localhost')).toBe('localhost');
    expect(inferAppDomainFromHostname('dar-ul-quran.localhost')).toBe('localhost');
  });

  it('returns apex for platform host', () => {
    expect(inferAppDomainFromHostname('mmsv2.aabtaab.com')).toBe('mmsv2.aabtaab.com');
    expect(inferAppDomainFromHostname('www.mmsv2.aabtaab.com')).toBe('mmsv2.aabtaab.com');
  });

  it('returns apex for tenant hosts', () => {
    expect(inferAppDomainFromHostname('dar-ul-quran.mmsv2.aabtaab.com')).toBe('mmsv2.aabtaab.com');
  });
});

describe('resolveAppDomain', () => {
  it('prefers configured domain', () => {
    expect(resolveAppDomain('dar-ul-quran.mmsv2.aabtaab.com', 'custom.example.com')).toBe(
      'custom.example.com',
    );
  });

  it('parses tenants against resolved domain', () => {
    const domain = resolveAppDomain('dar-ul-quran.mmsv2.aabtaab.com');
    expect(domain).toBe(DEFAULT_APP_DOMAIN);
    expect(parseTenantFromHost('dar-ul-quran.mmsv2.aabtaab.com', domain)).toBe('dar-ul-quran');
    expect(parseTenantFromHost('mmsv2.aabtaab.com', domain)).toBeNull();
  });
});
