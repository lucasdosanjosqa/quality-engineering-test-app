import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'viewer'] }).notNull(),
    status: text('status', { enum: ['active', 'inactive'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    check('users_role_check', sql`${table.role} in ('admin', 'viewer')`),
    check('users_status_check', sql`${table.status} in ('active', 'inactive')`),
  ],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('sessions_user_id_index').on(table.userId)],
);

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category', {
      enum: ['accessories', 'audio', 'keyboards', 'monitors', 'workspace'],
    }).notNull(),
    priceCents: integer('price_cents').notNull(),
    stockQuantity: integer('stock_quantity').notNull(),
    status: text('status', { enum: ['active', 'inactive'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('products_sku_unique').on(table.sku),
    index('products_name_index').on(table.name),
    index('products_category_index').on(table.category),
    index('products_status_index').on(table.status),
    check('products_price_check', sql`${table.priceCents} >= 0`),
    check('products_stock_check', sql`${table.stockQuantity} >= 0`),
    check(
      'products_category_check',
      sql`${table.category} in ('accessories', 'audio', 'keyboards', 'monitors', 'workspace')`,
    ),
    check(
      'products_status_check',
      sql`${table.status} in ('active', 'inactive')`,
    ),
  ],
);
