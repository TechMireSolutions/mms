/**
 * @file industryProfiles.ts
 * @description Typed industry profiles and independent recommendation resolvers.
 */

import type { AppTranslationKey } from './appTranslations.js';
import { type IndustryType } from './organizationBlueprintTypes.js';

export interface TerminologyProfile {
  facultyLabel: string;
  staffSingular: string;
  studentLabel: string;
  locationLabel: string;
}

export interface IndustryProfile {
  id: IndustryType;
  displayNameKey: AppTranslationKey;
  descriptionKey: AppTranslationKey;
  recommendedModules: readonly string[];
  recommendedBlueprintId: string;
  recommendedRoles: readonly string[];
  terminology: TerminologyProfile;
}

const COMMON_BUSINESS_MODULES = [
  'dashboard',
  'contacts',
  'faculty',
  'tasks',
  'attendance',
  'finance',
  'accounting',
  'messaging',
  'users',
] as const;

export const INDUSTRY_PROFILES: Record<IndustryType, IndustryProfile> = {
  madrasa: {
    id: 'madrasa',
    displayNameKey: 'organization.industry.madrasa',
    descriptionKey: 'organization.industry.madrasaDesc',
    recommendedModules: [
      'dashboard',
      'contacts',
      'messaging',
      'tasks',
      'students',
      'faculty',
      'sessions',
      'attendance',
      'enrollment',
      'hasanat',
      'examination',
      'questionBank',
      'finance',
      'accounting',
      'obligations',
      'users',
    ],
    recommendedBlueprintId: 'madrasa-standard-v1',
    recommendedRoles: ['mohtamim', 'nazim_taleemat', 'ustad', 'accountant', 'admin'],
    terminology: {
      facultyLabel: 'Faculty & Asatizah',
      staffSingular: 'Teacher',
      studentLabel: 'Students & Talaba',
      locationLabel: 'Campus / Block',
    },
  },
  hotel: {
    id: 'hotel',
    displayNameKey: 'organization.industry.hotel',
    descriptionKey: 'organization.industry.hotelDesc',
    recommendedModules: COMMON_BUSINESS_MODULES,
    recommendedBlueprintId: 'hotel-standard-v2',
    recommendedRoles: ['general_manager', 'department_head', 'supervisor', 'staff', 'admin'],
    terminology: {
      facultyLabel: 'Staff & Team',
      staffSingular: 'Employee',
      studentLabel: 'Guests & Patrons',
      locationLabel: 'Property / Wing',
    },
  },
  office: {
    id: 'office',
    displayNameKey: 'organization.industry.office',
    descriptionKey: 'organization.industry.officeDesc',
    recommendedModules: COMMON_BUSINESS_MODULES,
    recommendedBlueprintId: 'office-standard-v1',
    recommendedRoles: ['executive', 'team_lead', 'team_member', 'admin'],
    terminology: {
      facultyLabel: 'Staff & Personnel',
      staffSingular: 'Employee',
      studentLabel: 'Clients & Partners',
      locationLabel: 'Office / Floor',
    },
  },
  retail: {
    id: 'retail',
    displayNameKey: 'organization.industry.retail',
    descriptionKey: 'organization.industry.retailDesc',
    recommendedModules: COMMON_BUSINESS_MODULES,
    recommendedBlueprintId: 'retail-standard-v1',
    recommendedRoles: ['store_manager', 'inventory_lead', 'cashier', 'admin'],
    terminology: {
      facultyLabel: 'Store Associates',
      staffSingular: 'Staff',
      studentLabel: 'Customers & Shoppers',
      locationLabel: 'Store / Outlet',
    },
  },
  custom: {
    id: 'custom',
    displayNameKey: 'organization.industry.custom',
    descriptionKey: 'organization.industry.customDesc',
    recommendedModules: ['dashboard', 'contacts', 'messaging', 'tasks', 'faculty', 'users'],
    recommendedBlueprintId: 'office-standard-v1',
    recommendedRoles: ['manager', 'staff', 'admin'],
    terminology: {
      facultyLabel: 'Team Members',
      staffSingular: 'Member',
      studentLabel: 'Clients',
      locationLabel: 'Branch / Site',
    },
  },
  general: {
    id: 'general',
    displayNameKey: 'organization.industry.general',
    descriptionKey: 'organization.industry.generalDesc',
    recommendedModules: ['dashboard', 'contacts', 'messaging', 'tasks', 'faculty', 'users'],
    recommendedBlueprintId: 'office-standard-v1',
    recommendedRoles: ['manager', 'staff', 'admin'],
    terminology: {
      facultyLabel: 'Team Members',
      staffSingular: 'Member',
      studentLabel: 'Clients',
      locationLabel: 'Location',
    },
  },
};

export function getIndustryProfile(industry?: IndustryType | string | null): IndustryProfile {
  if (industry && industry in INDUSTRY_PROFILES) {
    return INDUSTRY_PROFILES[industry as IndustryType];
  }
  return INDUSTRY_PROFILES.madrasa;
}

export function getRecommendedModulesForIndustry(industry?: IndustryType | string | null): readonly string[] {
  return getIndustryProfile(industry).recommendedModules;
}

export function getRecommendedBlueprintForIndustry(industry?: IndustryType | string | null): string {
  return getIndustryProfile(industry).recommendedBlueprintId;
}

export function getTerminologyForIndustry(industry?: IndustryType | string | null): TerminologyProfile {
  return getIndustryProfile(industry).terminology;
}
