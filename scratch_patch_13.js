const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/migrations/060_migrate_hasanat_setup_config.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/workspaceSubdomain: tenant,\n          preferences: normalizedPrefs,\n        \}\);/, "workspaceSubdomain: tenant,\n          preferences: normalizedPrefs as never,\n        } as never);");
c1 = c1.replace(/workspaceSubdomain: tenant,\n          config: fieldConfigOnly,\n        \}\);/, "workspaceSubdomain: tenant,\n          config: fieldConfigOnly as never,\n        } as never);");
fs.writeFileSync(f1, c1);

const f2 = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/useUpdateHasanatFieldConfigMutation,/g, "useHasanatFieldConfigMutation,");
c2 = c2.replace(/useUpdateHasanatPreferencesMutation,/g, "useHasanatPreferencesMutation,");
c2 = c2.replace(/updateFieldConfig: hasanatUpdateFieldConfig\.mutateAsync,/g, "updateFieldConfig: hasanatFieldConfigMutation.mutateAsync,");
c2 = c2.replace(/updatePreferences: hasanatUpdatePreferences\.mutateAsync,/g, "updatePreferences: hasanatPreferencesMutation.mutateAsync,");
c2 = c2.replace(/const hasanatUpdateFieldConfig = useHasanatFieldConfigMutation\(\);/, "const hasanatFieldConfigMutation = useHasanatFieldConfigMutation();");
c2 = c2.replace(/const hasanatUpdatePreferences = useHasanatPreferencesMutation\(\);/, "const hasanatPreferencesMutation = useHasanatPreferencesMutation();");

fs.writeFileSync(f2, c2);

