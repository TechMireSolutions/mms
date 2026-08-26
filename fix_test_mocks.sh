#!/bin/bash
set -e

declare -a clean_modules=("contact" "student" "teacher")
declare -a legacy_modules=("attendance" "dashboard" "enrollment" "finance" "session" "user")

# Fix clean modules
for prefix in "${clean_modules[@]}"; do
  module_dir="${prefix}s/use-cases"
  for type in "ConfigService" "PreferencesService" "LookupsService"; do
    filename="${prefix}${type}.js"
    find apps/backend/src/__tests__ -name "*.ts" -exec sed -i '' "s|vi.mock('../lib/${filename}'|vi.mock('../${module_dir}/${filename}'|g" {} +
  done
done

# Fix legacy modules
for prefix in "${legacy_modules[@]}"; do
  for type in "ConfigService" "PreferencesService" "LookupsService"; do
    filename="${prefix}${type}.js"
    find apps/backend/src/__tests__ -name "*.ts" -exec sed -i '' "s|vi.mock('../lib/${filename}'|vi.mock('../services/${filename}'|g" {} +
  done
done

