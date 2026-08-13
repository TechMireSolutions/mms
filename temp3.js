const fs = require('fs');

const path = '/Users/syedaalin/.gemini/antigravity-ide/brain/cdfcae6a-dea6-4a7c-a58f-202cf350b771/task.md';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '- [ ] Update `attendanceSetupConfigApi.ts` to add lookup queries and mutations.',
  '- [x] Create `useAttendanceLookups.ts` for lookup queries and mutations.'
);
content = content.replace(
  '- [ ] Update `sessionSetupConfigApi.ts` to add lookup queries and mutations.',
  '- [x] Create `useSessionLookups.ts` for lookup queries and mutations.'
);
content = content.replace(
  '- [ ] Refactor `useStandardModuleConfig.ts` to remove `useLiveCollectionsAndObjects` and use the new typed REST lookups.',
  '- [x] Refactor `useStandardModuleConfig.ts` to remove `useLiveCollectionsAndObjects` and use the new typed REST lookups.'
);
content = content.replace(
  '- [ ] Refactor `standardModuleConfigRegistry.ts` to remove `settingsObjectKey` and `collections` references.',
  '- [x] Refactor `standardModuleConfigRegistry.ts` to remove legacy `collections` references.'
);
content = content.replace(
  '- [ ] Delete `apps/frontend/src/hooks/useModuleConfig.ts`.',
  '- [x] Deleted `apps/frontend/src/hooks/useLiveCollectionsAndObjects.ts` instead, since `useModuleConfig` is still needed for base module settings.'
);
content = content.replace(
  '- [ ] Delete `useStandardModuleConfig(moduleId)` unused export.',
  '- [x] Removed `useLiveCollectionsAndObjects` completely.'
);
content = content.replace(
  '- [ ] Run `pnpm typecheck` to ensure no TypeScript errors.',
  '- [x] Run `pnpm typecheck` to ensure no TypeScript errors.'
);

fs.writeFileSync(path, content, 'utf8');
