const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove useModuleConfig import
content = content.replace(/import { useModuleConfig } from '\.\/useModuleConfig';\n/, '');

// Remove useStandardModuleConfig export function entirely
const useStandardModuleConfigRegex = /export function useStandardModuleConfig<M extends StandardModuleId>\([\s\S]*?StandardModuleConfigExtraMap\[M\] \{\n\s*const config = STANDARD_MODULES_CONFIG_REGISTRY\[moduleId\];[\s\S]*?return \{\n\s*\.\.\.moduleConfigResult,\n\s*\} as ReturnType<typeof useModuleConfig<StandardModuleSettingsMap\[M\]>> &\n\s*StandardModuleConfigExtraMap\[M\];\n\}\n\n/;
content = content.replace(useStandardModuleConfigRegex, '');

fs.writeFileSync(path, content, 'utf8');
