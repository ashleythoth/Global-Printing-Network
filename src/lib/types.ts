export type UserRole = 'admin' | 'shop';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  shopId?: string;
}

export interface PrintShop {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ─── Product model ────────────────────────────────────────────────────────────

export type PrintType = 'document' | 'photo';

// Document-specific options
export type DocColorMode = 'bw' | 'color' | 'both';
export type DocSides     = 'single' | 'double' | 'both';

// Photo-specific options
export type PhotoSize    = '4x6' | '5x7' | '6x8' | '8x10' | '8x12' | '10x13' | '10x15' | '11x14' | '12x18' | '16x20' | '20x24' | '20x30';
export type PhotoFinish  = 'glossy' | 'matte' | 'lustre' | 'metallic';

export interface Product {
  id: string;
  name: string;
  description: string;
  printType: PrintType;

  // Document fields (used when printType === 'document')
  colorModes?: DocColorMode[];   // which color modes are offered
  sides?: DocSides[];            // which side options are offered
  minPages?: number;
  maxPages?: number;

  // Photo fields (used when printType === 'photo')
  sizes?: PhotoSize[];           // which print sizes are offered
  finishes?: PhotoFinish[];      // which finishes are offered

  isActive: boolean;
  createdAt: string;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface PricingTier {
  fromPage: number;
  toPage: number;
  pricePerPage: number;
}

// Per-variant pricing for photos (size + finish combination)
export interface PhotoPriceEntry {
  size: PhotoSize;
  finish: PhotoFinish;
  priceEach: number;
}

// ─── Paper types ──────────────────────────────────────────────────────────────

export interface PaperType {
  id: string;
  name: string;
  description: string;
  priceUpcharge: number;
}

// ─── Shop product config ──────────────────────────────────────────────────────

export interface ShopProduct {
  id: string;
  shopId: string;
  productId: string;
  isEnabled: boolean;
  // Document pricing
  pricingTiers: PricingTier[];
  paperTypes: PaperType[];
  // Photo pricing
  photoPrices: PhotoPriceEntry[];
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface JobFile {
  name: string;
  path: string;
  url: string;
}

export interface Job {
  id: string;
  shopId: string;
  productId: string;
  customerName: string;
  // Document job fields
  pages?: number;
  copies?: number;
  colorMode?: string;
  sides?: string;
  paperType?: string;
  paperUpcharge?: number;
  // Photo job fields
  photoSize?: string;
  photoFinish?: string;
  quantity?: number;
  // Common
  totalCost: number;
  status: JobStatus;
  notes: string;
  files?: JobFile[];
  createdAt: string;
  updatedAt: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const COLOR_MODE_LABELS: Record<DocColorMode, string> = {
  bw: 'Black & White',
  color: 'Full Color',
  both: 'B&W + Color',
};

export const SIDES_LABELS: Record<DocSides, string> = {
  single: 'Single-sided',
  double: 'Double-sided',
  both: 'Single & Double',
};

export const PHOTO_SIZE_LABELS: Record<PhotoSize, string> = {
  '4x6':   '4" × 6"',
  '5x7':   '5" × 7"',
  '6x8':   '6" × 8"',
  '8x10':  '8" × 10"',
  '8x12':  '8" × 12"',
  '10x13': '10" × 13"',
  '10x15': '10" × 15"',
  '11x14': '11" × 14"',
  '12x18': '12" × 18"',
  '16x20': '16" × 20"',
  '20x24': '20" × 24"',
  '20x30': '20" × 30"',
};

export const PHOTO_FINISH_LABELS: Record<PhotoFinish, string> = {
  glossy:   'Glossy',
  matte:    'Matte',
  lustre:   'Lustre',
  metallic: 'Metallic',
};
