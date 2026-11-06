export type ProjectType =
  | 'new_home'
  | 'addition'
  | 'kitchen'
  | 'bathroom'
  | 'commercial'
  | 'deck';

export type QualityTier = 'economy' | 'standard' | 'premium' | 'luxury';

export type RegionId =
  | 'midwest'
  | 'south'
  | 'mountain'
  | 'northeast'
  | 'west_coast'
  | 'high_cost';

export interface AddonId {
  id: string;
  label: string;
  description: string;
  /** Flat fee or per-sqft depending on unit */
  amount: number;
  unit: 'flat' | 'sqft' | 'percent';
}

export interface EstimateInput {
  projectType: ProjectType;
  squareFeet: number;
  quality: QualityTier;
  region: RegionId;
  addons: string[];
  contingencyPercent: number;
}

export interface LineItem {
  id: string;
  label: string;
  amount: number;
}

export interface EstimateResult {
  materials: number;
  labor: number;
  softCosts: number;
  addons: number;
  contingency: number;
  subtotal: number;
  total: number;
  costPerSqft: number;
  low: number;
  high: number;
  lines: LineItem[];
  timelineWeeks: { low: number; high: number };
}

export const PROJECT_TYPES: {
  id: ProjectType;
  label: string;
  blurb: string;
  basePerSqft: number;
  materialShare: number;
  softShare: number;
  weeksPerThousandSqft: number;
}[] = [
  {
    id: 'new_home',
    label: 'New Home',
    blurb: 'Ground-up single-family build',
    basePerSqft: 185,
    materialShare: 0.48,
    softShare: 0.12,
    weeksPerThousandSqft: 10,
  },
  {
    id: 'addition',
    label: 'Home Addition',
    blurb: 'Attached living space expansion',
    basePerSqft: 220,
    materialShare: 0.45,
    softShare: 0.14,
    weeksPerThousandSqft: 12,
  },
  {
    id: 'kitchen',
    label: 'Kitchen Remodel',
    blurb: 'Cabinets, counters, appliances',
    basePerSqft: 275,
    materialShare: 0.55,
    softShare: 0.1,
    weeksPerThousandSqft: 8,
  },
  {
    id: 'bathroom',
    label: 'Bathroom Remodel',
    blurb: 'Tile, fixtures, waterproofing',
    basePerSqft: 310,
    materialShare: 0.5,
    softShare: 0.1,
    weeksPerThousandSqft: 7,
  },
  {
    id: 'commercial',
    label: 'Commercial Fit-out',
    blurb: 'Office, retail, or light industrial',
    basePerSqft: 165,
    materialShare: 0.42,
    softShare: 0.16,
    weeksPerThousandSqft: 9,
  },
  {
    id: 'deck',
    label: 'Deck & Patio',
    blurb: 'Outdoor living structures',
    basePerSqft: 95,
    materialShare: 0.58,
    softShare: 0.08,
    weeksPerThousandSqft: 4,
  },
];

export const QUALITY_TIERS: {
  id: QualityTier;
  label: string;
  multiplier: number;
}[] = [
  { id: 'economy', label: 'Economy', multiplier: 0.82 },
  { id: 'standard', label: 'Standard', multiplier: 1 },
  { id: 'premium', label: 'Premium', multiplier: 1.28 },
  { id: 'luxury', label: 'Luxury', multiplier: 1.65 },
];

export const REGIONS: {
  id: RegionId;
  label: string;
  multiplier: number;
}[] = [
  { id: 'midwest', label: 'Midwest', multiplier: 0.92 },
  { id: 'south', label: 'South', multiplier: 0.95 },
  { id: 'mountain', label: 'Mountain West', multiplier: 1.05 },
  { id: 'northeast', label: 'Northeast', multiplier: 1.18 },
  { id: 'west_coast', label: 'West Coast', multiplier: 1.32 },
  { id: 'high_cost', label: 'High-cost metro', multiplier: 1.48 },
];

export const ADDONS: AddonId[] = [
  {
    id: 'hvac',
    label: 'HVAC upgrade',
    description: 'High-efficiency system package',
    amount: 18,
    unit: 'sqft',
  },
  {
    id: 'solar',
    label: 'Solar-ready / panels',
    description: 'Roof prep plus mid-size array',
    amount: 22,
    unit: 'sqft',
  },
  {
    id: 'landscape',
    label: 'Hardscape & landscaping',
    description: 'Drive, walkways, planting',
    amount: 14000,
    unit: 'flat',
  },
  {
    id: 'permits',
    label: 'Expedited permits',
    description: 'Fast-track municipal review',
    amount: 0.035,
    unit: 'percent',
  },
  {
    id: 'smart',
    label: 'Smart-home package',
    description: 'Lighting, locks, thermostat hub',
    amount: 6500,
    unit: 'flat',
  },
  {
    id: 'garage',
    label: 'Garage / carport',
    description: 'Two-bay enclosed structure',
    amount: 28000,
    unit: 'flat',
  },
];

function roundMoney(n: number): number {
  return Math.round(n / 50) * 50;
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const project = PROJECT_TYPES.find((p) => p.id === input.projectType)!;
  const quality = QUALITY_TIERS.find((q) => q.id === input.quality)!;
  const region = REGIONS.find((r) => r.id === input.region)!;

  const sqft = Math.max(50, input.squareFeet || 0);
  const base =
    sqft * project.basePerSqft * quality.multiplier * region.multiplier;

  const materials = base * project.materialShare;
  const softCosts = base * project.softShare;
  const labor = base - materials - softCosts;

  let addonTotal = 0;
  const addonLines: LineItem[] = [];

  for (const addonId of input.addons) {
    const addon = ADDONS.find((a) => a.id === addonId);
    if (!addon) continue;
    let amount = 0;
    if (addon.unit === 'flat') amount = addon.amount;
    if (addon.unit === 'sqft') amount = addon.amount * sqft;
    if (addon.unit === 'percent') amount = base * addon.amount;
    amount = roundMoney(amount);
    addonTotal += amount;
    addonLines.push({ id: addon.id, label: addon.label, amount });
  }

  const subtotal = materials + labor + softCosts + addonTotal;
  const contingency = subtotal * (input.contingencyPercent / 100);
  const total = subtotal + contingency;
  const costPerSqft = total / sqft;

  const lines: LineItem[] = [
    { id: 'materials', label: 'Materials & finishes', amount: roundMoney(materials) },
    { id: 'labor', label: 'Labor & trades', amount: roundMoney(labor) },
    { id: 'soft', label: 'Design, permits & soft costs', amount: roundMoney(softCosts) },
    ...addonLines,
    {
      id: 'contingency',
      label: `Contingency (${input.contingencyPercent}%)`,
      amount: roundMoney(contingency),
    },
  ];

  const weeks = Math.max(
    2,
    Math.round((sqft / 1000) * project.weeksPerThousandSqft * quality.multiplier),
  );

  return {
    materials: roundMoney(materials),
    labor: roundMoney(labor),
    softCosts: roundMoney(softCosts),
    addons: roundMoney(addonTotal),
    contingency: roundMoney(contingency),
    subtotal: roundMoney(subtotal),
    total: roundMoney(total),
    costPerSqft: Math.round(costPerSqft),
    low: roundMoney(total * 0.9),
    high: roundMoney(total * 1.15),
    lines,
    timelineWeeks: { low: Math.max(1, weeks - 2), high: weeks + 3 },
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}
