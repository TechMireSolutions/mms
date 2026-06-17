import { describe, expect, it } from 'vitest';
import {
  inferAppDomainFromHostname,
  isOriginAllowedForAppDomain,
  isTrustedWorkspaceOrigin,
  parseTenantFromHost,
  resolveAppDomain,
} from './tenantUtils.js';

const PLATFORM = 'platform.example.com';

describe('inferAppDomainFromHostname', () => {
  it('returns localhost for dev hosts', () => {
    expect(inferAppDomainFromHostname('localhost')).toBe('localhost');
    expect(inferAppDomainFromHostname('dar-ul-quran.localhost')).toBe('localhost');
  });

  it('returns apex for platform host', () => {
    expect(inferAppDomainFromHostname(PLATFORM)).toBe(PLATFORM);
    expect(inferAppDomainFromHostname(`www.${PLATFORM}`)).toBe(PLATFORM);
  });

  it('returns apex for tenant hosts', () => {
    expect(inferAppDomainFromHostname(`dar-ul-quran.${PLATFORM}`)).toBe(PLATFORM);
  });
});

describe('resolveAppDomain', () => {
  it('prefers configured domain', () => {
    expect(resolveAppDomain(`dar-ul-quran.${PLATFORM}`, 'custom.example.com')).toBe(
      'custom.example.com',
    );
  });

  it('infers apex from tenant hostname when env is unset', () => {
    const domain = resolveAppDomain(`dar-ul-quran.${PLATFORM}`);
    expect(domain).toBe(PLATFORM);
    expect(parseTenantFromHost(`dar-ul-quran.${PLATFORM}`, domain)).toBe('dar-ul-quran');
    expect(parseTenantFromHost(PLATFORM, domain)).toBeNull();
  });

  it('falls back to localhost when host cannot be inferred', () => {
    expect(resolveAppDomain('')).toBe('localhost');
  });
});

describe('isTrustedWorkspaceOrigin', () => {
  it('allows localhost dev origins only', () => {
    expect(isTrustedWorkspaceOrigin('http://localhost:5173')).toBe(true);
    expect(isTrustedWorkspaceOrigin('http://dar-ul-quran.localhost:5173')).toBe(true);
    expect(isTrustedWorkspaceOrigin(`https://${PLATFORM}`)).toBe(false);
  });
});

describe('isOriginAllowedForAppDomain', () => {
  it('allows apex and tenant origins for the configured domain', () => {
    expect(isOriginAllowedForAppDomain(`https://${PLATFORM}`, PLATFORM)).toBe(true);
    expect(isOriginAllowedForAppDomain(`https://dar-ul-quran.${PLATFORM}`, PLATFORM)).toBe(true);
    expect(isOriginAllowedForAppDomain('https://evil.example.net', PLATFORM)).toBe(false);
  });
});
