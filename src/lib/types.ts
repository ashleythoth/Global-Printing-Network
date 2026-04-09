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

export interface ShopProduct {
  id: string;
  shopId: string;
  productId: string;
  isEnabled: boolean;
  pricingTiers: PricingTier[];
}

export type JobStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface JobFile {
  name: string;
  path: string; // Supabase storage path
  url: string;  // signed or public URL
}

export interface Job {
  id: string;
  shopId: string;
  productId: string;
  customerName: string;
  pages: number;
  copies: number;
  totalCost: number;
  status: JobStatus;
  notes: string;
  files?: JobFile[];
  createdAt: string;
  updatedAt: string;
}