/**
 * @file organizationBlueprintTypes.ts
 * @description Industry-specific organizational templates for positions, locations, and departments.
 */

import { z } from 'zod';
import { LOCATION_TYPES } from './organizationModuleManifest.js';

export const INDUSTRY_TYPES = ['madrasa', 'hotel', 'office', 'retail', 'custom', 'general'] as const;
export type IndustryType = (typeof INDUSTRY_TYPES)[number];

export const blueprintLocationSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(LOCATION_TYPES).default('branch'),
  parentCode: z.string().max(64).optional(),
});

export type BlueprintLocation = z.infer<typeof blueprintLocationSchema>;

export const blueprintDepartmentSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
});

export type BlueprintDepartment = z.infer<typeof blueprintDepartmentSchema>;

export const blueprintDesignationSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  level: z.number().int().min(1).max(99).default(10),
});

export type BlueprintDesignation = z.infer<typeof blueprintDesignationSchema>;

export const blueprintPositionSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  departmentCode: z.string().min(1).max(64),
  designationCode: z.string().min(1).max(64),
  locationCode: z.string().max(64).optional(),
  parentPositionCode: z.string().max(64).optional(),
  capacity: z.number().int().min(1).max(500).default(1),
});

export type BlueprintPosition = z.infer<typeof blueprintPositionSchema>;

export const organizationBlueprintSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  industryType: z.enum(INDUSTRY_TYPES),
  version: z.number().int().min(1).default(1),
  description: z.string(),
  locations: z.array(blueprintLocationSchema),
  departments: z.array(blueprintDepartmentSchema),
  designations: z.array(blueprintDesignationSchema),
  positions: z.array(blueprintPositionSchema),
});

export type OrganizationBlueprint = z.infer<typeof organizationBlueprintSchema>;

export const MADRASA_STANDARD_V1_BLUEPRINT: OrganizationBlueprint = {
  id: 'madrasa-standard-v1',
  name: 'Standard Madrasa & Islamic Seminary',
  industryType: 'madrasa',
  version: 1,
  description: 'Traditional hierarchy covering Mohtamim, Taleemat, Tarbiyah, Hifz, and Dars-e-Nizami.',
  locations: [
    { code: 'CAMPUS-MAIN', name: 'Main Campus', type: 'campus' },
    { code: 'ACAD-BLOCK', name: 'Academic Block', type: 'site', parentCode: 'CAMPUS-MAIN' },
    { code: 'ADMIN-WING', name: 'Administration Wing', type: 'site', parentCode: 'CAMPUS-MAIN' },
    { code: 'DAR-UL-IQAMA', name: 'Hostel & Residence', type: 'site', parentCode: 'CAMPUS-MAIN' },
    { code: 'LIBRARY-HALL', name: 'Central Kutubkhana (Library)', type: 'site', parentCode: 'ACAD-BLOCK' },
  ],
  departments: [
    { code: 'ADMIN', name: 'General Administration' },
    { code: 'TALEEMAT', name: 'Academic Affairs (Taleemat)' },
    { code: 'HIFZ', name: 'Hifz-ul-Quran Faculty' },
    { code: 'NIZAMI', name: 'Dars-e-Nizami (Aalim Course)' },
    { code: 'TARBIYAH', name: 'Student Affairs & Tarbiyah' },
    { code: 'FINANCE', name: 'Finance & Accounts' },
  ],
  designations: [
    { code: 'MOHTAMIM', name: 'Mohtamim (Principal / Chancellor)', level: 1 },
    { code: 'NAZIM-TALEEM', name: 'Nazim-e-Taleemat (Academic Dean)', level: 2 },
    { code: 'SHAIKH-HADITH', name: 'Shaikh-ul-Hadith (Senior Professor)', level: 3 },
    { code: 'HEAD-HIFZ', name: 'Head of Hifz Faculty', level: 3 },
    { code: 'NAZIM-IQAMA', name: 'Nazim-e-Dar-ul-Iqama (Hostel Warden)', level: 3 },
    { code: 'USTAD-SENIOR', name: 'Senior Ustad (Lecturer)', level: 4 },
    { code: 'USTAD-HIFZ', name: 'Ustad-e-Hifz', level: 4 },
    { code: 'ACCOUNTANT', name: 'Chief Accountant', level: 4 },
    { code: 'ASSISTANT-TEACHER', name: 'Muallim / Teaching Assistant', level: 5 },
  ],
  positions: [
    { code: 'POS-MOHTAMIM', name: 'Mohtamim / Executive Director', departmentCode: 'ADMIN', designationCode: 'MOHTAMIM', locationCode: 'ADMIN-WING', capacity: 1 },
    { code: 'POS-NAZIM-TALEEM', name: 'Dean of Academic Affairs', departmentCode: 'TALEEMAT', designationCode: 'NAZIM-TALEEM', locationCode: 'ADMIN-WING', parentPositionCode: 'POS-MOHTAMIM', capacity: 1 },
    { code: 'POS-SHAIKH-HADITH', name: 'Chair of Hadith Studies', departmentCode: 'NIZAMI', designationCode: 'SHAIKH-HADITH', locationCode: 'ACAD-BLOCK', parentPositionCode: 'POS-NAZIM-TALEEM', capacity: 1 },
    { code: 'POS-HEAD-HIFZ', name: 'Head of Hifz Department', departmentCode: 'HIFZ', designationCode: 'HEAD-HIFZ', locationCode: 'ACAD-BLOCK', parentPositionCode: 'POS-NAZIM-TALEEM', capacity: 1 },
    { code: 'POS-HEAD-IQAMA', name: 'Superintendent of Dar-ul-Iqama', departmentCode: 'TARBIYAH', designationCode: 'NAZIM-IQAMA', locationCode: 'DAR-UL-IQAMA', parentPositionCode: 'POS-MOHTAMIM', capacity: 1 },
    { code: 'POS-USTAD-HADITH', name: 'Senior Ustad (Nizami Faculty)', departmentCode: 'NIZAMI', designationCode: 'USTAD-SENIOR', locationCode: 'ACAD-BLOCK', parentPositionCode: 'POS-SHAIKH-HADITH', capacity: 6 },
    { code: 'POS-USTAD-HIFZ', name: 'Ustad-e-Hifz (Quran Instructor)', departmentCode: 'HIFZ', designationCode: 'USTAD-HIFZ', locationCode: 'ACAD-BLOCK', parentPositionCode: 'POS-HEAD-HIFZ', capacity: 8 },
    { code: 'POS-CHIEF-ACCOUNTANT', name: 'Chief Financial Officer', departmentCode: 'FINANCE', designationCode: 'ACCOUNTANT', locationCode: 'ADMIN-WING', parentPositionCode: 'POS-MOHTAMIM', capacity: 1 },
  ],
};

export const HOTEL_STANDARD_V1_BLUEPRINT: OrganizationBlueprint = {
  id: 'hotel-standard-v1',
  name: 'Hospitality & Hotel Operations',
  industryType: 'hotel',
  version: 1,
  description: 'Hospitality hierarchy covering General Manager, Front Office, Housekeeping, and Food & Beverage.',
  locations: [
    { code: 'HOTEL-MAIN', name: 'Main Property / Hotel', type: 'hotel' },
    { code: 'TOWER-A', name: 'Guest Tower A', type: 'site', parentCode: 'HOTEL-MAIN' },
    { code: 'LOBBY-WING', name: 'Lobby & Reception', type: 'site', parentCode: 'HOTEL-MAIN' },
    { code: 'RESTAURANT-DINING', name: 'Dining & Kitchen Facility', type: 'site', parentCode: 'HOTEL-MAIN' },
  ],
  departments: [
    { code: 'EXECUTIVE', name: 'Executive Management' },
    { code: 'FRONT-OFFICE', name: 'Front Desk & Guest Services' },
    { code: 'HOUSEKEEPING', name: 'Housekeeping & Facilities' },
    { code: 'FNB', name: 'Food & Beverage' },
    { code: 'FINANCE', name: 'Finance & Purchasing' },
  ],
  designations: [
    { code: 'GM', name: 'General Manager', level: 1 },
    { code: 'OPS-MGR', name: 'Director of Operations', level: 2 },
    { code: 'FOM', name: 'Front Office Manager', level: 3 },
    { code: 'EXEC-CHEF', name: 'Executive Chef', level: 3 },
    { code: 'EXEC-HOUSEKEEPER', name: 'Executive Housekeeper', level: 3 },
    { code: 'FDA', name: 'Front Desk Associate', level: 4 },
    { code: 'LINE-COOK', name: 'Line Cook', level: 4 },
    { code: 'ROOM-ATTENDANT', name: 'Room Attendant', level: 4 },
  ],
  positions: [
    { code: 'POS-GM', name: 'General Manager', departmentCode: 'EXECUTIVE', designationCode: 'GM', locationCode: 'HOTEL-MAIN', capacity: 1 },
    { code: 'POS-OPS-MGR', name: 'Operations Director', departmentCode: 'EXECUTIVE', designationCode: 'OPS-MGR', locationCode: 'HOTEL-MAIN', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-FOM', name: 'Front Office Manager', departmentCode: 'FRONT-OFFICE', designationCode: 'FOM', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-OPS-MGR', capacity: 1 },
    { code: 'POS-EXEC-CHEF', name: 'Executive Chef', departmentCode: 'FNB', designationCode: 'EXEC-CHEF', locationCode: 'RESTAURANT-DINING', parentPositionCode: 'POS-OPS-MGR', capacity: 1 },
    { code: 'POS-EXEC-HOUSEKEEPER', name: 'Head of Housekeeping', departmentCode: 'HOUSEKEEPING', designationCode: 'EXEC-HOUSEKEEPER', locationCode: 'TOWER-A', parentPositionCode: 'POS-OPS-MGR', capacity: 1 },
    { code: 'POS-FDA', name: 'Front Desk Agent', departmentCode: 'FRONT-OFFICE', designationCode: 'FDA', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-FOM', capacity: 6 },
    { code: 'POS-ROOM-ATTENDANT', name: 'Guest Room Attendant', departmentCode: 'HOUSEKEEPING', designationCode: 'ROOM-ATTENDANT', locationCode: 'TOWER-A', parentPositionCode: 'POS-EXEC-HOUSEKEEPER', capacity: 12 },
  ],
};

export const OFFICE_STANDARD_V1_BLUEPRINT: OrganizationBlueprint = {
  id: 'office-standard-v1',
  name: 'Corporate & Tech Office',
  industryType: 'office',
  version: 1,
  description: 'Enterprise office hierarchy covering Executive, Product, Engineering, and People Ops.',
  locations: [
    { code: 'HQ', name: 'Corporate Headquarters', type: 'head_office' },
    { code: 'FLOOR-1', name: 'Executive & Admin Floor', type: 'site', parentCode: 'HQ' },
    { code: 'FLOOR-2', name: 'Engineering & Product Floor', type: 'site', parentCode: 'HQ' },
  ],
  departments: [
    { code: 'EXECUTIVE', name: 'Executive Leadership' },
    { code: 'ENGINEERING', name: 'Engineering' },
    { code: 'PRODUCT', name: 'Product & Design' },
    { code: 'PEOPLE', name: 'People & Operations' },
    { code: 'FINANCE', name: 'Finance & Accounting' },
  ],
  designations: [
    { code: 'CEO', name: 'Chief Executive Officer', level: 1 },
    { code: 'VP-ENG', name: 'VP of Engineering', level: 2 },
    { code: 'VP-PROD', name: 'VP of Product', level: 2 },
    { code: 'ENG-MGR', name: 'Engineering Manager', level: 3 },
    { code: 'SR-DEV', name: 'Senior Software Engineer', level: 4 },
    { code: 'DEV', name: 'Software Engineer', level: 5 },
  ],
  positions: [
    { code: 'POS-CEO', name: 'Chief Executive Officer', departmentCode: 'EXECUTIVE', designationCode: 'CEO', locationCode: 'FLOOR-1', capacity: 1 },
    { code: 'POS-VP-ENG', name: 'VP of Engineering', departmentCode: 'ENGINEERING', designationCode: 'VP-ENG', locationCode: 'FLOOR-2', parentPositionCode: 'POS-CEO', capacity: 1 },
    { code: 'POS-VP-PROD', name: 'VP of Product', departmentCode: 'PRODUCT', designationCode: 'VP-PROD', locationCode: 'FLOOR-2', parentPositionCode: 'POS-CEO', capacity: 1 },
    { code: 'POS-ENG-MGR', name: 'Engineering Manager', departmentCode: 'ENGINEERING', designationCode: 'ENG-MGR', locationCode: 'FLOOR-2', parentPositionCode: 'POS-VP-ENG', capacity: 3 },
    { code: 'POS-SR-DEV', name: 'Senior Fullstack Engineer', departmentCode: 'ENGINEERING', designationCode: 'SR-DEV', locationCode: 'FLOOR-2', parentPositionCode: 'POS-ENG-MGR', capacity: 10 },
  ],
};

export const RETAIL_STANDARD_V1_BLUEPRINT: OrganizationBlueprint = {
  id: 'retail-standard-v1',
  name: 'Retail Store & Warehousing',
  industryType: 'retail',
  version: 1,
  description: 'Retail organization covering Store Leadership, Floor Operations, Inventory, and Cashiering.',
  locations: [
    { code: 'STORE-MAIN', name: 'Main Retail Store', type: 'store' },
    { code: 'SALES-FLOOR', name: 'Sales Floor', type: 'site', parentCode: 'STORE-MAIN' },
    { code: 'WAREHOUSE', name: 'Inventory & Backroom', type: 'site', parentCode: 'STORE-MAIN' },
  ],
  departments: [
    { code: 'STORE-OPS', name: 'Store Management' },
    { code: 'SALES', name: 'Sales & Customer Care' },
    { code: 'INVENTORY', name: 'Warehouse & Inventory' },
    { code: 'CASHIERING', name: 'Cash Office & Checkout' },
  ],
  designations: [
    { code: 'STORE-MGR', name: 'Store General Manager', level: 1 },
    { code: 'ASST-MGR', name: 'Assistant Store Manager', level: 2 },
    { code: 'INV-LEAD', name: 'Inventory & Logistics Supervisor', level: 3 },
    { code: 'SALES-ASSOC', name: 'Sales Associate', level: 4 },
    { code: 'CASHIER', name: 'Cashier', level: 4 },
  ],
  positions: [
    { code: 'POS-STORE-MGR', name: 'Store General Manager', departmentCode: 'STORE-OPS', designationCode: 'STORE-MGR', locationCode: 'STORE-MAIN', capacity: 1 },
    { code: 'POS-ASST-MGR', name: 'Assistant Store Manager', departmentCode: 'STORE-OPS', designationCode: 'ASST-MGR', locationCode: 'SALES-FLOOR', parentPositionCode: 'POS-STORE-MGR', capacity: 2 },
    { code: 'POS-INV-LEAD', name: 'Inventory Lead', departmentCode: 'INVENTORY', designationCode: 'INV-LEAD', locationCode: 'WAREHOUSE', parentPositionCode: 'POS-STORE-MGR', capacity: 1 },
    { code: 'POS-SALES-ASSOC', name: 'Customer Sales Associate', departmentCode: 'SALES', designationCode: 'SALES-ASSOC', locationCode: 'SALES-FLOOR', parentPositionCode: 'POS-ASST-MGR', capacity: 15 },
    { code: 'POS-CASHIER', name: 'Checkout Cashier', departmentCode: 'CASHIERING', designationCode: 'CASHIER', locationCode: 'SALES-FLOOR', parentPositionCode: 'POS-ASST-MGR', capacity: 8 },
  ],
};

export const ORGANIZATION_BLUEPRINTS: readonly OrganizationBlueprint[] = [
  MADRASA_STANDARD_V1_BLUEPRINT,
  HOTEL_STANDARD_V1_BLUEPRINT,
  OFFICE_STANDARD_V1_BLUEPRINT,
  RETAIL_STANDARD_V1_BLUEPRINT,
];

export function findBlueprintById(id: string): OrganizationBlueprint | undefined {
  return ORGANIZATION_BLUEPRINTS.find((b) => b.id === id);
}

export function getBlueprintsForIndustry(industry: IndustryType): OrganizationBlueprint[] {
  return ORGANIZATION_BLUEPRINTS.filter((b) => b.industryType === industry);
}
