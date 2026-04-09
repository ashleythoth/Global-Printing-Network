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
  {
    id: 'p1',
    name: 'Standard Document Print',
    description: 'Black & white document printing on standard 80gsm paper.',
    category: 'documents',
    minPages: 1,
    maxPages: 500,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Premium Business Cards',
    description: 'Full-color business cards on 350gsm matte or gloss stock.',
    category: 'business-cards',
    minPages: 50,
    maxPages: 1000,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'p3',
    name: 'Large Format Banner',
    description: 'Wide-format printing for banners, posters, and signage.',
    category: 'large-format',
    minPages: 1,
    maxPages: 50,
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'p4',
    name: 'Color Document Print',
    description: 'Full-color document printing on premium 100gsm paper.',
    category: 'documents',
    minPages: 1,
    maxPages: 200,
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
  },
];

const SEED_SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'sp1',
    shopId: 's1',
    productId: 'p1',
    isEnabled: true,
    pricingTiers: [
      { fromPage: 1, toPage: 50, pricePerPage: 0.15 },
      { fromPage: 51, toPage: 200, pricePerPage: 0.10 },
      { fromPage: 201, toPage: 500, pricePerPage: 0.07 },
    ],
  },
  {
    id: 'sp2',
    shopId: 's1',
    productId: 'p2',
    isEnabled: true,
    pricingTiers: [
      { fromPage: 50, toPage: 200, pricePerPage: 0.50 },
      { fromPage: 201, toPage: 1000, pricePerPage: 0.35 },
    ],
  },
  {
    id: 'sp3',
    shopId: 's2',
    productId: 'p1',
    isEnabled: false,
    pricingTiers: [],
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
    totalCost: 13.50,
    status: 'completed',
    notes: 'Double-sided, stapled',
    files: [],
    createdAt: '2024-05-01T09:00:00Z',
    updatedAt: '2024-05-01T11:30:00Z',
  },
  {
    id: 'j2',
    shopId: 's1',
    productId: 'p2',
    customerName: 'Bob Martinez',
    pages: 100,
    copies: 1,
    totalCost: 50.00,
    status: 'completed',
    notes: 'Gloss finish',
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
    copies: 3,
    totalCost: 36.00,
    status: 'in-progress',
    notes: 'Urgent order',
    files: [],
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2024-05-10T08:00:00Z',
  },
  {
    id: 'j4',
    shopId: 's1',
    productId: 'p2',
    customerName: 'David Lee',
    pages: 250,
    copies: 1,
    totalCost: 87.50,
    status: 'pending',
    notes: 'Matte finish, rounded corners',
    files: [],
    createdAt: '2024-05-11T10:00:00Z',
    updatedAt: '2024-05-11T10:00:00Z',
  },
  {
    id: 'j5',
    shopId: 's1',
    productId: 'p1',
    customerName: 'Eva Chen',
    pages: 30,
    copies: 5,
    totalCost: 22.50,
    status: 'pending',
    notes: '',
    files: [],
    createdAt: '2024-05-12T13:00:00Z',
    updatedAt: '2024-05-12T13:00:00Z',
  },
  {
    id: 'j6',
    shopId: 's2',
    productId: 'p3',
    customerName: 'Frank Nguyen',
    pages: 5,
    copies: 2,
    totalCost: 120.00,
    status: 'completed',
    notes: '3m x 1m banner',
    files: [],
    createdAt: '2024-05-05T09:00:00Z',
    updatedAt: '2024-05-05T15:00:00Z',
  },
  {
    id: 'j7',
    shopId: 's2',
    productId: 'p3',
    customerName: 'Grace Kim',
    pages: 3,
    copies: 1,
    totalCost: 75.00,
    status: 'pending',
    notes: 'Event banner for Saturday',
    files: [],
    createdAt: '2024-05-12T11:00:00Z',
    updatedAt: '2024-05-12T11:00:00Z',
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
  getUsers().find(u => u.email === email);

// Shops
export const getShops = (): PrintShop[] => getItem<PrintShop>(KEYS.SHOPS);
export const getShopById = (id: string): PrintShop | undefined =>
  getShops().find(s => s.id === id);

export const createShop = (shop: Omit<PrintShop, 'id' | 'createdAt'>, userPassword: string): PrintShop => {
  const shops = getShops();
  const users = getUsers();
  const newShop: PrintShop = {
    ...shop,
    id: `s${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const newUser: User = {
    id: `u${Date.now()}`,
    email: shop.email,
    password: userPassword,
    role: 'shop',
    shopId: newShop.id,
  };
  setItem(KEYS.SHOPS, [...shops, newShop]);
  setItem(KEYS.USERS, [...users, newUser]);
  return newShop;
};

export const updateShop = (id: string, updates: Partial<PrintShop>): void => {
  const shops = getShops().map(s => s.id === id ? { ...s, ...updates } : s);
  setItem(KEYS.SHOPS, shops);
};

export const deleteShop = (id: string): void => {
  setItem(KEYS.SHOPS, getShops().filter(s => s.id !== id));
};

// Products
export const getProducts = (): Product[] => getItem<Product>(KEYS.PRODUCTS);
export const getProductById = (id: string): Product | undefined =>
  getProducts().find(p => p.id === id);

export const createProduct = (product: Omit<Product, 'id' | 'createdAt'>): Product => {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: `p${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  setItem(KEYS.PRODUCTS, [...products, newProduct]);
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>): void => {
  const products = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
  setItem(KEYS.PRODUCTS, products);
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
    const newSP: ShopProduct = {
      id: `sp${Date.now()}`,
      shopId,
      productId,
      isEnabled: false,
      pricingTiers: [],
      ...updates,
    };
    setItem(KEYS.SHOP_PRODUCTS, [...all, newSP]);
  }
};

// Jobs
export const getJobs = (): Job[] => getItem<Job>(KEYS.JOBS);

export const getJobsByShopId = (shopId: string): Job[] =>
  getJobs().filter(j => j.shopId === shopId);

export const createJob = (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Job => {
  const jobs = getJobs();
  const now = new Date().toISOString();
  const newJob: Job = {
    ...job,
    id: `j${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  setItem(KEYS.JOBS, [...jobs, newJob]);
  return newJob;
};

export const updateJobStatus = (id: string, status: JobStatus): void => {
  const jobs = getJobs().map(j =>
    j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j
  );
  setItem(KEYS.JOBS, jobs);
};

export const updateJob = (id: string, updates: Partial<Job>): void => {
  const jobs = getJobs().map(j =>
    j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
  );
  setItem(KEYS.JOBS, jobs);
};

export const deleteJob = (id: string): void => {
  setItem(KEYS.JOBS, getJobs().filter(j => j.id !== id));
};