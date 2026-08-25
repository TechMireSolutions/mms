const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/lib/contexts/ContactConfigContext.tsx', 'utf8');

content = content.replace(/const { fieldConfig, prefs, updateConfig, updatePrefs } = useContactConfig\(\);/g, 'const { settings, updateSettings } = useContactConfig();');
content = content.replace(/derived entirely from the current fieldConfig\./g, 'derived entirely from the current configuration.');

fs.writeFileSync('apps/frontend/src/lib/contexts/ContactConfigContext.tsx', content, 'utf8');
