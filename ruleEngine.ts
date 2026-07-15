export interface AnalysisResult {
  category: string | null;
  brand: string | null;
  model: string | null;
  topic: string | null;
  tags: string[];
  summary: string;
}

export interface RuleLike {
  keyword: string;
  category?: string | null;
  brand?: string | null;
}

const BRAND_KEYWORDS: Record<string, string> = {
  nvidia: 'NVIDIA',
  geforce: 'NVIDIA',
  amd: 'AMD',
  radeon: 'AMD',
  ryzen: 'AMD',
  intel: 'Intel',
  asus: 'ASUS',
  rog: 'ASUS',
  msi: 'MSI',
  gigabyte: 'Gigabyte',
  aorus: 'Gigabyte',
  asrock: 'ASRock',
  corsair: 'Corsair',
  kingston: 'Kingston',
  samsung: 'Samsung',
  'western digital': 'WD',
  seagate: 'Seagate',
  evga: 'EVGA',
  zotac: 'Zotac',
  crucial: 'Crucial',
  'g.skill': 'G.Skill',
  gskill: 'G.Skill',
  noctua: 'Noctua',
  'be quiet': 'be quiet!',
  bequiet: 'be quiet!',
  'cooler master': 'Cooler Master',
  coolermaster: 'Cooler Master',
  nzxt: 'NZXT',
  lg: 'LG',
  dell: 'Dell',
  acer: 'Acer',
  benq: 'BenQ',
  viewsonic: 'ViewSonic',
  sapphire: 'Sapphire',
  powercolor: 'PowerColor',
  palit: 'Palit',
  xfx: 'XFX',
  inno3d: 'Inno3D',
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  grafikkarte: 'GPU',
  'graphics card': 'GPU',
  gpu: 'GPU',
  geforce: 'GPU',
  radeon: 'GPU',
  rtx: 'GPU',
  gtx: 'GPU',
  prozessor: 'CPU',
  processor: 'CPU',
  cpu: 'CPU',
  ryzen: 'CPU',
  arbeitsspeicher: 'RAM',
  memory: 'RAM',
  ram: 'RAM',
  ddr4: 'RAM',
  ddr5: 'RAM',
  nvme: 'SSD',
  'm.2': 'SSD',
  ssd: 'SSD',
  festplatte: 'HDD',
  hdd: 'HDD',
  mainboard: 'Mainboard',
  motherboard: 'Mainboard',
  netzteil: 'PSU',
  'power supply': 'PSU',
  psu: 'PSU',
  kuehler: 'Kuehlung',
  kühler: 'Kuehlung',
  cooler: 'Kuehlung',
  luefter: 'Kuehlung',
  lüfter: 'Kuehlung',
  wasserkuehlung: 'Kuehlung',
  aio: 'Kuehlung',
  gehaeuse: 'Gehaeuse',
  gehäuse: 'Gehaeuse',
  case: 'Gehaeuse',
  monitor: 'Monitor',
  display: 'Monitor',
  bildschirm: 'Monitor',
};

const TOPIC_KEYWORDS: Record<string, string> = {
  review: 'Review',
  test: 'Review',
  testbericht: 'Review',
  benchmark: 'Benchmark',
  benchmarks: 'Benchmark',
  unboxing: 'Unboxing',
  vergleich: 'Vergleich',
  comparison: 'Vergleich',
  tutorial: 'Tutorial',
  anleitung: 'Tutorial',
  howto: 'Tutorial',
  installation: 'Installation',
  einbau: 'Installation',
  install: 'Installation',
  fix: 'Fix',
  reparatur: 'Fix',
  repair: 'Fix',
  overclock: 'Overclocking',
  overclocking: 'Overclocking',
  uebertakten: 'Overclocking',
  bios: 'BIOS',
  uefi: 'BIOS',
};

const MODEL_PATTERNS: RegExp[] = [
  /\bRTX\s?-?\s?\d{4}\s?(ti|super)?\b/i,
  /\bGTX\s?-?\s?\d{3,4}\s?(ti|super)?\b/i,
  /\bRX\s?-?\s?\d{4}\s?(xt|xtx)?\b/i,
  /\bRyzen\s?\d\s?\d{3,4}[a-z0-9]*\b/i,
  /\bCore\s?i[3579]-?\d{4,5}[a-z]*\b/i,
  /\b\d{3,4}\s?(GB|TB)\b/i,
];

const STOPWORDS = new Set([
  'mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v',
  'the', 'and', 'und', 'der', 'die', 'das', 'mit', 'von', 'ein', 'eine',
  'video', 'final', 'copy', 'neu', 'new',
]);

function normalize(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_.\-]+/g, ' ')
    .toLowerCase();
}

export function classifyLocally(
  filename: string,
  customRules: RuleLike[] = [],
): AnalysisResult {
  const norm = normalize(filename);
  const words = norm.split(/\s+/).filter(Boolean);

  let category: string | null = null;
  let brand: string | null = null;

  for (const rule of customRules) {
    if (rule.keyword && norm.includes(rule.keyword.toLowerCase())) {
      category = category ?? rule.category ?? null;
      brand = brand ?? rule.brand ?? null;
    }
  }

  if (!category) {
    for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
      if (norm.includes(kw)) {
        category = cat;
        break;
      }
    }
  }

  if (!brand) {
    for (const [kw, b] of Object.entries(BRAND_KEYWORDS)) {
      if (norm.includes(kw)) {
        brand = b;
        break;
      }
    }
  }

  let model: string | null = null;
  for (const pattern of MODEL_PATTERNS) {
    const match = filename.match(pattern);
    if (match) {
      model = match[0].replace(/[_-]/g, ' ').trim();
      break;
    }
  }

  let topic: string | null = null;
  for (const [kw, t] of Object.entries(TOPIC_KEYWORDS)) {
    if (norm.includes(kw)) {
      topic = t;
      break;
    }
  }

  const tagSet = new Set<string>();
  if (category) tagSet.add(category.toLowerCase());
  if (brand) tagSet.add(brand.toLowerCase());
  if (topic) tagSet.add(topic.toLowerCase());
  for (const w of words) {
    if (tagSet.size >= 6) break;
    if (w.length < 3 || /^\d+$/.test(w) || STOPWORDS.has(w)) continue;
    tagSet.add(w);
  }

  const summaryParts: string[] = [topic ?? 'Video'];
  if (brand || model) {
    summaryParts.push(`zu ${[brand, model].filter(Boolean).join(' ')}`);
  } else if (category) {
    summaryParts.push(`zum Thema ${category}`);
  }

  return {
    category,
    brand,
    model,
    topic,
    tags: Array.from(tagSet).slice(0, 6),
    summary: `${summaryParts.join(' ')}.`,
  };
}
