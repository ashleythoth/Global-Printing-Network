import { User, PrintShop, Product, ShopProduct, Job, JobStatus } from './types';

const KEYS = {
  USERS: 'printhub_users',
  SHOPS: 'printhub_shops',
  PRODUCTS: 'printhub_products',
  SHOP_PRODUCTS: 'printhub_shop_products',
  JOBS: 'printhub_jobs',
};

const SEED_USERS: User[] = [
  { id: 'u1', email: 'admin@printhub.com', password: 'admin123', role: 'admin' },
  { id: 'u2', email: 'shop1@printhub.com', password: 'shop123', role: 'shop', shopId: 's1' },
  { id: 'u3', email: 'shop2@printhub.com', password: 'shop123', role: 'shop', shopId: 's2' },
];

const SEED_SHOPS: PrintShop[] = [
  {
    id: 's1',
    name: 'Quick Print Co.',
    email: 'shop1@printhub.com',
    phone: '+1 (555) 100-2000',
    address: '123 Main St, New York, NY 10001',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 's2',
    name: 'Express Prints LLC',
    email: 'shop2@printhub.com',
    phone: '+1 (555) 300-4000',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    status: 'active',
    createdAt: '2024-02-20T14:00:00Z',
  },
];

const SEED_PRODUCTS: Product[] = [
  // ── Documents ──────────────────────────────────────────────────────────────
  {
    id: 'p1',
    name: 'Black & White Document',
    description: 'Standard B&W printing for everyday documents, reports, and forms.',
    printType: 'document',
    colorModes: ['bw'],
    sides: ['single', 'double'],
    minPages: 1,
    maxPages: 500,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Color Document',
    description: 'Full-color printing for presentations, brochures, and marketing materials.',
    printType: 'document',
    colorModes: ['color'],
    sides: ['single', 'double'],
    minPages: 1,
    maxPages: 200,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'p3',
    name: 'B&W + Color Document',
    description: 'Flexible document printing — choose B&W or color per order.',
    printType: 'document',
    colorModes: ['bw', 'color'],
    sides: ['single', 'double'],
    minPages: 1,
    maxPages: 300,
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
  },
  // ── Photos ─────────────────────────────────────────────────────────────────
  {
    id: 'p4',
    name: 'Standard Photo Print',
    description: 'Everyday photo prints in popular sizes. Great for personal and family photos.',
    printType: 'photo',
    sizes: ['4x6', '5x7', '8x10'],
    finishes: ['glossy', 'matte'],
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 'p5',
    name: 'Premium Photo Print',
    description: 'High-quality photo prints with premium finish options including lustre and metallic.',
    printType: 'photo',
    sizes: ['4x6', '5x7', '8x10', '8x12', '11x14', '16x20'],
    finishes: ['glossy', 'matte', 'lustre', 'metallic'],
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'p6',
    name: 'Large Photo Print',
    description: 'Large-format photo prints for wall art, portraits, and display.',
    printType: 'photo',
    sizes: ['12x18', '16x20', '20x24', '20x30'],
    finishes: ['glossy', 'matte', 'lustre'],
    isActive: true,
    createdAt: '2024-01-06T00:00:00Z',
  },
];

const SEED_SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'sp1',
    shopId: 's1',
    productId: 'p1',
    isEnabled: true,
    pricingTiers: [
      { fromPage: 1, toPage: 50, pricePerPage: 0.12 },
      { fromPage: 51, toPage: 200, pricePerPage: 0.09 },
      { fromPage: 201, toPage: 500, pricePerPage: 0.07 },
    ],
    paperTypes: [
      { id: 'pt1', name: 'Standard 80gsm', description: 'Standard copy paper', priceUpcharge: 0 },
      { id: 'pt2', name: 'Premium 100gsm', description: 'Heavier, brighter white', priceUpcharge: 0.02 },
    ],
    photoPrices: [],
  },
  {
    id: 'sp2',
    shopId: 's1',
    productId: 'p4',
    isEnabled: true,
    pricingTiers: [],
    paperTypes: [],
    photoPrices: [
      { size: '4x6', finish: 'glossy', priceEach: 0.29 },
      { size: '4x6', finish: 'matte', priceEach: 0.35 },
      { size: '5x7', finish: 'glossy', priceEach: 0.99 },
      { size: '5x7', finish: 'matte', priceEach: 1.09 },
      { size: '8x10', finish: 'glossy', priceEach: 2.99 },
      { size: '8x10', finish: 'matte', priceEach: 3.29 },
    ],
  },
];

const SEED_JOBS: Job[] = [
  {
    id: 'j1',
    shopId: 's1',
    productId: 'p1',
    customerName: 'Alice Johnson',
    pages: 45,
    copies: 2,
    colorMode: 'Black & White',
    sides: 'Double-sided',
    paperType: 'Standard 80gsm',
    totalCost: 10.80,
    status: 'completed',
    notes: 'Stapled',
    files: [],
    createdAt: '2024-05-01T09:00:00Z',
    updatedAt: '2024-05-01T11:30:00Z',
  },
  {
    id: 'j2',
    shopId: 's1',
    productId: 'p4',
    customerName: 'Bob Martinez',
    photoSize: '8x10',
    photoFinish: 'Glossy',
    quantity: 3,
    totalCost: 8.97,
    status: 'completed',
    notes: '',
    files: [],
    createdAt: '2024-05-03T14:00:00Z',
    updatedAt: '2024-05-03T16:00:00Z',
  },
  {
    id: 'j3',
    shopId: 's1',
    productId: 'p1',
    customerName: 'Carol White',
    pages: 120,
    copies: 1,
    colorMode: 'Black & White',
    sides: 'Single-sided',
    paperType: 'Premium 100gsm',
    totalCost: 13.20,
    status: 'in-progress',
    notes: 'Urgent',
    files: [],
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2024-05-10T08:00:00Z',
  },
  {
    id: 'j4',
    shopId: 's1',
    productId: 'p4',
    customerName: 'David Lee',
    photoSize: '4x6',
    photoFinish: 'Matte',
    quantity: 20,
    totalCost: 7.00,
    status: 'pending',
    notes: 'Family photos',
    files: [],
    createdAt: '2024-05-11T10:00:00Z',
    updatedAt: '2024-05-11T10:00:00Z',
  },
];

function getItem<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  return JSON.parse(raw) as T[];
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function seedIfEmpty(): void {
  if (!localStorage.getItem(KEYS.USERS)) setItem(KEYS.USERS, SEED_USERS);
  if (!localStorage.getItem(KEYS.SHOPS)) setItem(KEYS.SHOPS, SEED_SHOPS);
  if (!localStorage.getItem(KEYS.PRODUCTS)) setItem(KEYS.PRODUCTS, SEED_PRODUCTS);
  if (!localStorage.getItem(KEYS.SHOP_PRODUCTS)) setItem(KEYS.SHOP_PRODUCTS, SEED_SHOP_PRODUCTS);
  if (!localStorage.getItem(KEYS.JOBS)) setItem(KEYS.JOBS, SEED_JOBS);
}

seedIfEmpty();

// Users
export const getUsers = (): User[] => getItem<User>(KEYS.USERS);
export const getUserByEmail = (email: string): User | undefined =>
  getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());

// Shops
export const getShops = (): PrintShop[] => getItem<PrintShop>(KEYS.SHOPS);
export const getShopById = (id: string): PrintShop | undefined =>
  getShops().find(s => s.id === id);

export const createShop = (shop: Omit<PrintShop, 'id' | 'createdAt'>, userPassword: string): PrintShop => {
  const shops = getShops();
  const users = getUsers();
  const newShop: PrintShop = { ...shop, id: `s${Date.now()}`, createdAt: new Date().toISOString() };
  const newUser: User = { id: `u${Date.now()}`, email: shop.email, password: userPassword, role: 'shop', shopId: newShop.id };
  setItem(KEYS.SHOPS, [...shops, newShop]);
  setItem(KEYS.USERS, [...users, newUser]);
  return newShop;
};

export const updateShop = (id: string, updates: Partial<PrintShop>): void => {
  setItem(KEYS.SHOPS, getShops().map(s => s.id === id ? { ...s, ...updates } : s));
};

export const deleteShop = (id: string): void => {
  setItem(KEYS.SHOPS, getShops().filter(s => s.id !== id));
};

// Products
export const getProducts = (): Product[] => getItem<Product>(KEYS.PRODUCTS);
export const getProductById = (id: string): Product | undefined =>
  getProducts().find(p => p.id === id);

export const createProduct = (product: Omit<Product, 'id' | 'createdAt'>): Product => {
  const newProduct: Product = { ...product, id: `p${Date.now()}`, createdAt: new Date().toISOString() };
  setItem(KEYS.PRODUCTS, [...getProducts(), newProduct]);
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>): void => {
  setItem(KEYS.PRODUCTS, getProducts().map(p => p.id === id ? { ...p, ...updates } : p));
};

export const deleteProduct = (id: string): void => {
  setItem(KEYS.PRODUCTS, getProducts().filter(p => p.id !== id));
  setItem(KEYS.SHOP_PRODUCTS, getShopProducts().filter(sp => sp.productId !== id));
};

// ShopProducts
export const getShopProducts = (): ShopProduct[] => getItem<ShopProduct>(KEYS.SHOP_PRODUCTS);

export const getShopProductsByShopId = (shopId: string): ShopProduct[] =>
  getShopProducts().filter(sp => sp.shopId === shopId);

export const getShopProduct = (shopId: string, productId: string): ShopProduct | undefined =>
  getShopProducts().find(sp => sp.shopId === shopId && sp.productId === productId);

export const upsertShopProduct = (shopId: string, productId: string, updates: Partial<ShopProduct>): void => {
  const all = getShopProducts();
  const existing = all.find(sp => sp.shopId === shopId && sp.productId === productId);
  if (existing) {
    setItem(KEYS.SHOP_PRODUCTS, all.map(sp =>
      sp.shopId === shopId && sp.productId === productId ? { ...sp, ...updates } : sp
    ));
  } else {
    setItem(KEYS.SHOP_PRODUCTS, [...all, {
      id: `sp${Date.now()}`, shopId, productId,
      isEnabled: false, pricingTiers: [], paperTypes: [], photoPrices: [],
      ...updates,
    }]);
  }
};

// Jobs
export const getJobs = (): Job[] => getItem<Job>(KEYS.JOBS);

export const getJobsByShopId = (shopId: string): Job[] =>
  getJobs().filter(j => j.shopId === shopId);

export const createJob = (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Job => {
  const now = new Date().toISOString();
  const newJob: Job = { ...job, id: `j${Date.now()}`, createdAt: now, updatedAt: now };
  setItem(KEYS.JOBS, [...getJobs(), newJob]);
  return newJob;
};

export const updateJobStatus = (id: string, status: JobStatus): void => {
  setItem(KEYS.JOBS, getJobs().map(j =>
    j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j
  ));
};

export const updateJob = (id: string, updates: Partial<Job>): void => {
  setItem(KEYS.JOBS, getJobs().map(j =>
    j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
  ));
};

export const deleteJob = (id: string): void => {
  setItem(KEYS.JOBS, getJobs().filter(j => j.id !== id));
};
