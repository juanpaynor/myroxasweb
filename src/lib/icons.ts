// Material icon name to emoji mapping for web display
export const iconMap: Record<string, string> = {
  construction: '🔧',
  warning: '⚠️',
  lightbulb: '💡',
  delete: '🗑️',
  local_hospital: '🏥',
  more_horiz: '⋯',
  report_problem: '⚠️',
  // Fallback
  default: '📋'
};

export function getIconEmoji(iconName: string): string {
  return iconMap[iconName] || iconMap.default;
}

export const availableIcons = [
  { name: 'construction', emoji: '🔧', label: 'Construction/Public Works' },
  { name: 'warning', emoji: '⚠️', label: 'Warning/Safety' },
  { name: 'lightbulb', emoji: '💡', label: 'Lightbulb/Electricity' },
  { name: 'delete', emoji: '🗑️', label: 'Waste/Garbage' },
  { name: 'local_hospital', emoji: '🏥', label: 'Hospital/Health' },
  { name: 'more_horiz', emoji: '⋯', label: 'More/Other' },
  { name: 'report_problem', emoji: '⚠️', label: 'Report Problem' }
];

export const recommendedColors = [
  { name: 'Blue', hex: '#3B82F6', label: 'General/Infrastructure' },
  { name: 'Red', hex: '#EF4444', label: 'Urgent/Safety' },
  { name: 'Green', hex: '#10B981', label: 'Environment/Health' },
  { name: 'Orange', hex: '#F59E0B', label: 'Maintenance/Utilities' },
  { name: 'Purple', hex: '#8B5CF6', label: 'Community Services' },
  { name: 'Yellow', hex: '#EAB308', label: 'Warnings/Alerts' },
  { name: 'Gray', hex: '#6B7280', label: 'Other/Miscellaneous' }
];
