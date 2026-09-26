import { scryptSync } from 'node:crypto';

import type { products, users } from './schema.js';

type NewUser = typeof users.$inferInsert;
type NewProduct = typeof products.$inferInsert;

const createdAt = new Date('2026-01-15T12:00:00.000Z');

function createPasswordHash(password: string, salt: string): string {
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}

export const seedUsers: NewUser[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'admin@commerceops.dev',
    fullName: 'Alex Morgan',
    passwordHash: createPasswordHash('Admin123!', 'commerceops-admin-v1'),
    role: 'admin',
    status: 'active',
    createdAt,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    email: 'viewer@commerceops.dev',
    fullName: 'Taylor Reed',
    passwordHash: createPasswordHash('Viewer123!', 'commerceops-viewer-v1'),
    role: 'viewer',
    status: 'active',
    createdAt,
  },
];

const productData: Omit<NewProduct, 'createdAt' | 'updatedAt'>[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    sku: 'ACC-USB-C-001',
    name: 'USB-C Hub 7-in-1',
    description: 'Compact aluminum hub with HDMI, USB, and card reader ports.',
    category: 'accessories',
    priceCents: 6990,
    stockQuantity: 24,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    sku: 'AUD-HEAD-001',
    name: 'Studio Wireless Headphones',
    description: 'Over-ear headphones with active noise cancellation.',
    category: 'audio',
    priceCents: 18990,
    stockQuantity: 12,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    sku: 'KEY-MECH-001',
    name: 'Compact Mechanical Keyboard',
    description: 'Hot-swappable 75 percent keyboard with tactile switches.',
    category: 'keyboards',
    priceCents: 12990,
    stockQuantity: 18,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    sku: 'MON-4K-001',
    name: '27-inch 4K Monitor',
    description: 'IPS display with USB-C power delivery and adjustable stand.',
    category: 'monitors',
    priceCents: 44990,
    stockQuantity: 7,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    sku: 'WRK-DESK-001',
    name: 'Adjustable Standing Desk',
    description: 'Electric height-adjustable desk with memory controls.',
    category: 'workspace',
    priceCents: 59990,
    stockQuantity: 5,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    sku: 'ACC-MOUSE-001',
    name: 'Ergonomic Wireless Mouse',
    description: 'Right-handed mouse with programmable buttons.',
    category: 'accessories',
    priceCents: 7990,
    stockQuantity: 31,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    sku: 'AUD-MIC-001',
    name: 'USB Podcast Microphone',
    description: 'Cardioid condenser microphone with desk stand.',
    category: 'audio',
    priceCents: 10990,
    stockQuantity: 9,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    sku: 'KEY-LOW-001',
    name: 'Low-profile Keyboard',
    description: 'Slim wireless keyboard for multi-device workflows.',
    category: 'keyboards',
    priceCents: 8990,
    stockQuantity: 16,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    sku: 'MON-QHD-001',
    name: '24-inch QHD Monitor',
    description: 'Compact QHD monitor with height-adjustable stand.',
    category: 'monitors',
    priceCents: 29990,
    stockQuantity: 0,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    sku: 'WRK-CHAIR-001',
    name: 'Mesh Office Chair',
    description: 'Breathable task chair with adjustable lumbar support.',
    category: 'workspace',
    priceCents: 32990,
    stockQuantity: 8,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000011',
    sku: 'ACC-STAND-001',
    name: 'Aluminum Laptop Stand',
    description: 'Ventilated stand sized for laptops up to 16 inches.',
    category: 'accessories',
    priceCents: 4990,
    stockQuantity: 22,
    status: 'active',
  },
  {
    id: '20000000-0000-4000-8000-000000000012',
    sku: 'AUD-SPEAK-001',
    name: 'Desktop Speaker Pair',
    description: 'Compact powered speakers with balanced sound.',
    category: 'audio',
    priceCents: 9990,
    stockQuantity: 4,
    status: 'inactive',
  },
];

export const seedProducts: NewProduct[] = productData.map((product) => ({
  ...product,
  createdAt,
  updatedAt: createdAt,
}));
