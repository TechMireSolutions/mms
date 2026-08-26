#!/bin/bash
set -e

# Fix test files
sed -i '' "s|../lib/contactLookupsService.js|../contacts/use-cases/contactLookupsService.js|g" apps/backend/src/__tests__/contactLookupsService.test.ts
sed -i '' "s|../lib/contactConfigService.js|../contacts/use-cases/contactConfigService.js|g" apps/backend/src/__tests__/contactSetupConfigService.test.ts
sed -i '' "s|../lib/contactPreferencesService.js|../contacts/use-cases/contactPreferencesService.js|g" apps/backend/src/__tests__/contactSetupConfigService.test.ts
sed -i '' "s|../lib/contactLookupsService.js|../contacts/use-cases/contactLookupsService.js|g" apps/backend/src/__tests__/contactUseCases.test.ts
sed -i '' "s|../lib/contactPreferencesService.js|../contacts/use-cases/contactPreferencesService.js|g" apps/backend/src/__tests__/contactUseCases.test.ts
sed -i '' "s|../lib/studentLookupsService.js|../students/use-cases/studentLookupsService.js|g" apps/backend/src/__tests__/studentLookupsService.test.ts

# Fix contacts
sed -i '' "s|../../lib/contactPreferencesService.js|./contactPreferencesService.js|g" apps/backend/src/contacts/use-cases/contactDuplicateScanUseCases.ts
sed -i '' "s|../../lib/contactConfigService.js|./contactConfigService.js|g" apps/backend/src/contacts/use-cases/contactExportUseCases.ts
sed -i '' "s|../../lib/contactPreferencesService.js|./contactPreferencesService.js|g" apps/backend/src/contacts/use-cases/contactInferenceUseCases.ts
sed -i '' "s|../../lib/contactConfigService.js|./contactConfigService.js|g" apps/backend/src/contacts/use-cases/contactLoadUseCases.ts
sed -i '' "s|../../lib/contactLookupsService.js|./contactLookupsService.js|g" apps/backend/src/contacts/use-cases/contactLoadUseCases.ts
sed -i '' "s|../../lib/contactPreferencesService.js|./contactPreferencesService.js|g" apps/backend/src/contacts/use-cases/contactLoadUseCases.ts
sed -i '' "s|../../lib/contactLookupsService.js|./contactLookupsService.js|g" apps/backend/src/contacts/use-cases/contactValidationUseCases.ts
sed -i '' "s|../../lib/contactConfigService.js|./contactConfigService.js|g" apps/backend/src/contacts/use-cases/contactValidationUseCases.ts

# Fix internal imports in the moved files (contacts)
sed -i '' "s|from './tenantContext.js'|from '../../lib/tenantContext.js'|g" apps/backend/src/contacts/use-cases/contactLookupsService.ts
sed -i '' "s|from './slugifyLookupLabel.js'|from '../../lib/slugifyLookupLabel.js'|g" apps/backend/src/contacts/use-cases/contactLookupsService.ts
sed -i '' "s|from './livePush.js'|from '../../lib/livePush.js'|g" apps/backend/src/contacts/use-cases/contactLookupsService.ts
sed -i '' "s|from './tenantContext.js'|from '../../lib/tenantContext.js'|g" apps/backend/src/contacts/use-cases/contactPreferencesService.ts
sed -i '' "s|from './contactRelationshipMirrorService.js'|from '../../lib/contactRelationshipMirrorService.js'|g" apps/backend/src/contacts/use-cases/contactPreferencesService.ts

# Fix shared service still in lib
sed -i '' "s|./contactConfigService.js|../contacts/use-cases/contactConfigService.js|g" apps/backend/src/lib/contactRelationshipMirrorService.ts
sed -i '' "s|./contactLookupsService.js|../contacts/use-cases/contactLookupsService.js|g" apps/backend/src/lib/contactRelationshipMirrorService.ts

# Fix routes (using services shim)
sed -i '' "s|../../../lib/attendanceLookupsService.js|../../../services/attendanceLookupsService.js|g" apps/backend/src/routes/tenant/attendance/attendanceLookupRoutes.ts
sed -i '' "s|../../lib/dashboardPreferencesService.js|../../services/dashboardPreferencesService.js|g" apps/backend/src/routes/tenant/dashboard.ts
sed -i '' "s|../../../lib/financeConfigService.js|../../../services/financeConfigService.js|g" apps/backend/src/routes/tenant/finance/financeSetupConfigRoutes.ts
sed -i '' "s|../../../lib/financePreferencesService.js|../../../services/financePreferencesService.js|g" apps/backend/src/routes/tenant/finance/financeSetupConfigRoutes.ts
sed -i '' "s|../../../lib/sessionLookupsService.js|../../../services/sessionLookupsService.js|g" apps/backend/src/routes/tenant/sessions/sessionLookupRoutes.ts

# Fix internal imports in the moved files (legacy services)
sed -i '' "s|from './tenantContext.js'|from '../lib/tenantContext.js'|g" apps/backend/src/services/attendanceLookupsService.ts
sed -i '' "s|from './livePush.js'|from '../lib/livePush.js'|g" apps/backend/src/services/attendanceLookupsService.ts

# Fix students
sed -i '' "s|../../lib/studentPreferencesService.js|./studentPreferencesService.js|g" apps/backend/src/students/use-cases/studentOperationUseCases.ts
sed -i '' "s|../../lib/studentConfigService.js|./studentConfigService.js|g" apps/backend/src/students/use-cases/studentSanitizeUseCases.ts

# Fix teachers
sed -i '' "s|../../lib/teacherPreferencesService.js|./teacherPreferencesService.js|g" apps/backend/src/teachers/use-cases/teacherOperationUseCases.ts
sed -i '' "s|../../lib/teacherConfigService.js|./teacherConfigService.js|g" apps/backend/src/teachers/use-cases/teacherSanitizeUseCases.ts

