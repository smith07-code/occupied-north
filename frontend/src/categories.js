// Single source of truth for category keys, display labels, and icons,
// shared by the form, the saved-locations list, and the map markers.
export const CATEGORIES = [
  { value: 'landmark', label: 'Landmark', icon: '🏛️' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'beach', label: 'Beach', icon: '🏖️' },
  { value: 'disputed_religious_installation', label: 'Disputed religious installation', icon: '⛩️' },
  { value: 'military_presence', label: 'Military presence', icon: '🪖' },
  { value: 'other', label: 'Other', icon: '📍' },
];

export function getCategoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}
