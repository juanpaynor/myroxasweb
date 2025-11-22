#!/bin/bash

# Files to update (excluding dashboard which is already done)
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
  echo "Processing $file..."
  
  # Add ThemeToggle import if not present
  if ! grep -q "ThemeToggle" "$file"; then
    sed -i '' '/^import.*lucide-react/a\
import { ThemeToggle } from '"'"'@/components/ThemeToggle'"'"';
' "$file"
  fi
  
  # Add dark mode classes
  sed -i '' 's/className="min-h-screen bg-gray-50"/className="min-h-screen bg-gray-50 dark:bg-gray-900"/g' "$file"
  sed -i '' 's/className="bg-white shadow-md border-b border-gray-200"/className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700"/g' "$file"
  sed -i '' 's/"bg-white rounded/"bg-white dark:bg-gray-800 rounded/g' "$file"
  sed -i '' 's/"bg-white border/"bg-white dark:bg-gray-800 border/g' "$file"
  sed -i '' 's/border-gray-200/border-gray-200 dark:border-gray-700/g' "$file"
  sed -i '' 's/border-gray-100/border-gray-100 dark:border-gray-700/g' "$file"
  sed -i '' 's/text-gray-900/text-gray-900 dark:text-white/g' "$file"
  sed -i '' 's/text-gray-600 /text-gray-600 dark:text-gray-300 /g' "$file"
  sed -i '' 's/text-gray-500/text-gray-500 dark:text-gray-400/g' "$file"
  sed -i '' 's/bg-gray-50 /bg-gray-50 dark:bg-gray-700 /g' "$file"
  sed -i '' 's/bg-gray-100 /bg-gray-100 dark:bg-gray-700 /g' "$file"
  sed -i '' 's/hover:bg-gray-100/hover:bg-gray-100 dark:hover:bg-gray-700/g' "$file"
  
done

echo "Dark mode classes added to all files!"
