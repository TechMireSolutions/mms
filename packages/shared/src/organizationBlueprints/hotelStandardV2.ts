/**
 * @file hotelStandardV2.ts
 * @description Expanded hotel organization blueprint (additive v2).
 */

import type { OrganizationBlueprint } from '../organizationBlueprintTypes.js';

export const HOTEL_STANDARD_V2_BLUEPRINT: OrganizationBlueprint = {
  id: 'hotel-standard-v2',
  name: 'Hospitality Operations (Expanded)',
  industryType: 'hotel',
  version: 2,
  description:
    'Fuller hotel tree covering Executive, HR, Finance, Front Office, F&B, Engineering, IT, and Security.',
  locations: [
    { code: 'HOTEL-MAIN', name: 'Main Property / Hotel', type: 'hotel' },
    { code: 'TOWER-A', name: 'Guest Tower A', type: 'site', parentCode: 'HOTEL-MAIN' },
    { code: 'LOBBY-WING', name: 'Lobby & Reception', type: 'site', parentCode: 'HOTEL-MAIN' },
    { code: 'RESTAURANT-DINING', name: 'Dining & Kitchen Facility', type: 'site', parentCode: 'HOTEL-MAIN' },
    { code: 'BACK-OF-HOUSE', name: 'Back of House / Engineering', type: 'site', parentCode: 'HOTEL-MAIN' },
  ],
  departments: [
    { code: 'EXECUTIVE', name: 'Executive Office' },
    { code: 'HR', name: 'Human Resources' },
    { code: 'FINANCE', name: 'Finance' },
    { code: 'FRONT-OFFICE', name: 'Front Office' },
    { code: 'HOUSEKEEPING', name: 'Housekeeping' },
    { code: 'FNB', name: 'Food & Beverage' },
    { code: 'KITCHEN', name: 'Kitchen' },
    { code: 'ENGINEERING', name: 'Engineering' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'SECURITY', name: 'Security' },
  ],
  designations: [
    { code: 'GM', name: 'General Manager', level: 1 },
    { code: 'DIR-FIN', name: 'Director of Finance', level: 2 },
    { code: 'DIR-HR', name: 'Director of HR', level: 2 },
    { code: 'FOM', name: 'Front Office Manager', level: 3 },
    { code: 'ASST-FOM', name: 'Assistant Front Office Manager', level: 4 },
    { code: 'DUTY-MGR', name: 'Duty Manager', level: 4 },
    { code: 'FDS', name: 'Front Desk Supervisor', level: 5 },
    { code: 'FDA', name: 'Front Desk Agent', level: 6 },
    { code: 'DIR-FNB', name: 'Director F&B', level: 2 },
    { code: 'EXEC-CHEF', name: 'Executive Chef', level: 3 },
    { code: 'CHIEF-ENG', name: 'Chief Engineer', level: 3 },
    { code: 'IT-MGR', name: 'IT Manager', level: 3 },
    { code: 'ASST-IT', name: 'Assistant IT Manager', level: 4 },
    { code: 'IT-EXEC', name: 'IT Executive', level: 5 },
    { code: 'SEC-MGR', name: 'Security Manager', level: 3 },
    { code: 'SEC-OFF', name: 'Security Officer', level: 5 },
  ],
  positions: [
    { code: 'POS-GM', name: 'General Manager', departmentCode: 'EXECUTIVE', designationCode: 'GM', locationCode: 'HOTEL-MAIN', capacity: 1 },
    { code: 'POS-DIR-FIN', name: 'Director of Finance', departmentCode: 'FINANCE', designationCode: 'DIR-FIN', locationCode: 'HOTEL-MAIN', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-DIR-HR', name: 'Director of HR', departmentCode: 'HR', designationCode: 'DIR-HR', locationCode: 'HOTEL-MAIN', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-FOM', name: 'Front Office Manager', departmentCode: 'FRONT-OFFICE', designationCode: 'FOM', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-ASST-FOM', name: 'Assistant Front Office Manager', departmentCode: 'FRONT-OFFICE', designationCode: 'ASST-FOM', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-FOM', capacity: 1 },
    { code: 'POS-DUTY-MGR', name: 'Duty Manager', departmentCode: 'FRONT-OFFICE', designationCode: 'DUTY-MGR', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-FOM', capacity: 2 },
    { code: 'POS-FDS', name: 'Front Desk Supervisor', departmentCode: 'FRONT-OFFICE', designationCode: 'FDS', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-ASST-FOM', capacity: 2 },
    { code: 'POS-FDA', name: 'Front Desk Agent', departmentCode: 'FRONT-OFFICE', designationCode: 'FDA', locationCode: 'LOBBY-WING', parentPositionCode: 'POS-FDS', capacity: 8 },
    { code: 'POS-DIR-FNB', name: 'Director F&B', departmentCode: 'FNB', designationCode: 'DIR-FNB', locationCode: 'RESTAURANT-DINING', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-EXEC-CHEF', name: 'Executive Chef', departmentCode: 'KITCHEN', designationCode: 'EXEC-CHEF', locationCode: 'RESTAURANT-DINING', parentPositionCode: 'POS-DIR-FNB', capacity: 1 },
    { code: 'POS-CHIEF-ENG', name: 'Chief Engineer', departmentCode: 'ENGINEERING', designationCode: 'CHIEF-ENG', locationCode: 'BACK-OF-HOUSE', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-IT-MGR', name: 'IT Manager', departmentCode: 'IT', designationCode: 'IT-MGR', locationCode: 'BACK-OF-HOUSE', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-ASST-IT', name: 'Assistant IT Manager', departmentCode: 'IT', designationCode: 'ASST-IT', locationCode: 'BACK-OF-HOUSE', parentPositionCode: 'POS-IT-MGR', capacity: 1 },
    { code: 'POS-IT-EXEC', name: 'IT Executive', departmentCode: 'IT', designationCode: 'IT-EXEC', locationCode: 'BACK-OF-HOUSE', parentPositionCode: 'POS-ASST-IT', capacity: 3 },
    { code: 'POS-SEC-MGR', name: 'Security Manager', departmentCode: 'SECURITY', designationCode: 'SEC-MGR', locationCode: 'HOTEL-MAIN', parentPositionCode: 'POS-GM', capacity: 1 },
    { code: 'POS-SEC-OFF', name: 'Security Officer', departmentCode: 'SECURITY', designationCode: 'SEC-OFF', locationCode: 'HOTEL-MAIN', parentPositionCode: 'POS-SEC-MGR', capacity: 8 },
  ],
};
