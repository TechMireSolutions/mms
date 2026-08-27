import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_INITIAL_DATA,
  ONBOARDING_STEP_DEFS,
} from './onboardingWizardTypes';

describe('useOnboardingWizardController Definition & Types', () => {
  it('defines valid initial onboarding state', () => {
    expect(ONBOARDING_INITIAL_DATA.name).toBe('');
    expect(ONBOARDING_INITIAL_DATA.subdomain).toBe('');
    expect(ONBOARDING_INITIAL_DATA.email).toBe('');
    expect(ONBOARDING_INITIAL_DATA.agreedTerms).toBe(false);
  });

  it('contains mandatory onboarding wizard steps in definition', () => {
    expect(ONBOARDING_STEP_DEFS.length).toBe(2);
    expect(ONBOARDING_STEP_DEFS[0]?.id).toBe(1);
    expect(ONBOARDING_STEP_DEFS[1]?.id).toBe(2);
  });
});
