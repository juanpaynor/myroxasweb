#!/bin/bash

files=(
  "src/app/admin/reports/page.tsx"
  "src/app/admin/users/page.tsx"
  "src/app/admin/categories/page.tsx"
  "src/app/admin/departments/page.tsx"
  "src/app/admin/department-users/page.tsx"
  "src/app/admin/announcements/page.tsx"
  "src/app/admin/announcement-categories/page.tsx"
  "src/app/admin/test-data/page.tsx"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  
  # Remove duplicate dark: classes
  sed -i '' 's/dark:[a-z-]* dark:[a-z-]* dark:[a-z-]*/dark:bg-gray-700/g' "$file"
  sed -i '' 's/ dark:[a-z-]* dark:[a-z-]*/ dark:bg-gray-700/g' "$file"
  
done

echo "Fixed duplicate classes!"
