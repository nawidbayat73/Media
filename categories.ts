export interface CategoryDef {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'GPU', label: 'Grafikkarte', color: '#22C55E', icon: 'expansion-card-variant' },
  { id: 'CPU', label: 'Prozessor', color: '#3B82F6', icon: 'cpu-64-bit' },
  { id: 'RAM', label: 'Arbeitsspeicher', color: '#A855F7', icon: 'memory' },
  { id: 'SSD', label: 'SSD', color: '#F97316', icon: 'harddisk' },
  { id: 'HDD', label: 'Festplatte', color: '#F59E0B', icon: 'nas' },
  { id: 'Mainboard', label: 'Mainboard', color: '#EF4444', icon: 'developer-board' },
  { id: 'PSU', label: 'Netzteil', color: '#EAB308', icon: 'power-plug' },
  { id: 'Kuehlung', label: 'Kühlung', color: '#06B6D4', icon: 'fan' },
  { id: 'Gehaeuse', label: 'Gehäuse', color: '#6B7280', icon: 'desktop-tower' },
  { id: 'Monitor', label: 'Monitor', color: '#EC4899', icon: 'monitor' },
  { id: 'Sonstiges', label: 'Sonstiges', color: '#94A3B8', icon: 'help-circle-outline' },
];

export function getCategory(id: string | null): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export const TOPICS = [
  'Review',
  'Benchmark',
  'Unboxing',
  'Vergleich',
  'Tutorial',
  'Installation',
  'Fix',
  'Overclocking',
  'BIOS',
];
