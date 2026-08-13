const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/features/hasanat/hooks/hasanatSetupConfigApi.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/import \{ apiClient \} from '@\/lib\/apiClient';/, "import apiClient from '@/lib/apiClient';");
c1 = c1.replace(/export async function getHasanatFieldConfig/g, "export async function fetchHasanatFieldConfig");
c1 = c1.replace(/export async function updateHasanatFieldConfig/g, "export async function saveHasanatFieldConfigAsync");
c1 = c1.replace(/export async function getHasanatPreferences/g, "export async function fetchHasanatPreferences");
c1 = c1.replace(/export async function updateHasanatPreferences/g, "export async function saveHasanatPreferencesAsync");
fs.writeFileSync(f1, c1);

const f2 = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/hooks/collections/hasanat.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/useUpdateHasanatFieldConfigMutation/g, "useHasanatFieldConfigMutation");
c2 = c2.replace(/useUpdateHasanatPreferencesMutation/g, "useHasanatPreferencesMutation");
fs.writeFileSync(f2, c2);

const f3 = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/useUpdateHasanatFieldConfigMutation/g, "useHasanatFieldConfigMutation");
c3 = c3.replace(/useUpdateHasanatPreferencesMutation/g, "useHasanatPreferencesMutation");
fs.writeFileSync(f3, c3);

