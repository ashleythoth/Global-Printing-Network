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

export type ProductCategory = 'documents' | 'business-cards' | 'large-format';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  minPages: number;
  maxPages: number;
  isActive: boolean;
  createdAt: string;
}

export interface PricingTier {
  fromPage: number;
  toPage: number;
  pricePerPage: number;
}

export interface PaperType {
  id: string;
  name: string;           // e.g. "Standard", "Card Stock", "Gloss"
  description: string;    // e.g. "80gsm standard copy paper"
  priceUpcharge: number;  // extra $ per page on top of base price
}

export interface ShopProduct {
  id: string;
  shopId: string;
  productId: string;
  isEnabled: boolean;
  pricingTiers: PricingTier[];
  paperTypes: PaperType[];
}

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
  pages: number;
  copies: number;
  paperType?: string;       // name of selected paper type
  paperUpcharge?: number;   // upcharge per page applied
  totalCost: number;
  status: JobStatus;
  notes: string;
  files?: JobFile[];
  createdAt: string;
  updatedAt: string;
}
