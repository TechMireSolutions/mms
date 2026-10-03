import { describe, expect, it } from 'vitest';
import {
  INDUSTRY_PROFILES,
  getIndustryProfile,
  getRecommendedModulesForIndustry,
  getRecommendedBlueprintForIndustry,
  getTerminologyForIndustry,
} from '../industryProfiles.js';
import { INDUSTRY_TYPES } from '../organizationBlueprintTypes.js';

describe('industryProfiles', () => {
  it('covers all supported industry types', () => {
    for (const type of INDUSTRY_TYPES) {
      expect(INDUSTRY_PROFILES[type]).toBeDefined();
      expect(INDUSTRY_PROFILES[type].id).toBe(type);
    }
  });

  it('provides independent recommended modules for hotel industry', () => {
    const modules = getRecommendedModulesForIndustry('hotel');
    expect(modules).toContain('tasks');
    expect(modules).toContain('faculty');
    expect(modules).toContain('attendance');
    expect(modules).toContain('finance');
    expect(modules).toContain('accounting');
    expect(modules).not.toContain('students');
    expect(modules).not.toContain('hasanat');
  });

  it('provides independent recommended blueprint for each industry', () => {
    expect(getRecommendedBlueprintForIndustry('hotel')).toBe('hotel-standard-v1');
    expect(getRecommendedBlueprintForIndustry('office')).toBe('office-standard-v1');
    expect(getRecommendedBlueprintForIndustry('retail')).toBe('retail-standard-v1');
    expect(getRecommendedBlueprintForIndustry('madrasa')).toBe('madrasa-standard-v1');
  });

  it('provides tailored terminology without breaking canonical internal models', () => {
    const hotelTerms = getTerminologyForIndustry('hotel');
    expect(hotelTerms.staffSingular).toBe('Employee');
    expect(hotelTerms.studentLabel).toBe('Guests & Patrons');

    const madrasaTerms = getTerminologyForIndustry('madrasa');
    expect(madrasaTerms.staffSingular).toBe('Teacher');
    expect(madrasaTerms.studentLabel).toBe('Students & Talaba');
  });

  it('falls back safely to madrasa profile on unknown or empty input', () => {
    const fallback = getIndustryProfile(null);
    expect(fallback.id).toBe('madrasa');
  });
});
