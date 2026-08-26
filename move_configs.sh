#!/bin/bash
set -e

declare -a clean_modules=("contact" "student" "teacher")
declare -a legacy_modules=("attendance" "dashboard" "enrollment" "finance" "session" "user")

for prefix in "${clean_modules[@]}"; do
  module_dir="${prefix}s/use-cases"
  
  for type in "ConfigService" "PreferencesService" "LookupsService"; do
    filename="${prefix}${type}.ts"
    lib_path="apps/backend/src/lib/${filename}"
    dest_path="apps/backend/src/${module_dir}/${filename}"
    shim_path="apps/backend/src/services/${filename}"
    
    if [ -f "$lib_path" ]; then
      echo "Moving $lib_path to $dest_path..."
      mv "$lib_path" "$dest_path"
      
      # Update shim to point to new location
      if [ -f "$shim_path" ]; then
        echo "export * from '../${module_dir}/${filename%%.ts}.js';" > "$shim_path"
      fi
    fi
  done
done

for prefix in "${legacy_modules[@]}"; do
  for type in "ConfigService" "PreferencesService" "LookupsService"; do
    filename="${prefix}${type}.ts"
    lib_path="apps/backend/src/lib/${filename}"
    dest_path="apps/backend/src/services/${filename}"
    
    if [ -f "$lib_path" ]; then
      echo "Moving $lib_path to $dest_path..."
      mv "$lib_path" "$dest_path"
    fi
  done
done
