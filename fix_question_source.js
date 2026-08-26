const fs = require('fs');
const file = 'apps/frontend/src/tenant/features/question-bank/components/QuestionSourceInput.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace(
    'import { useState, useMemo } from "react";',
    'import { useState, useMemo } from "react";\nimport { useTranslation } from "@/hooks/useTranslation";'
  );
  
  content = content.replace(
    'export function QuestionSourceInput({ value, onChange, books }: QuestionSourceInputProps) {',
    'export function QuestionSourceInput({ value, onChange, books }: QuestionSourceInputProps) {\n  const { t } = useTranslation();'
  );
}

content = content.replace('placeholder="Select..."', 'placeholder={t("questionBank.source.placeholder")}');

fs.writeFileSync(file, content, 'utf8');
