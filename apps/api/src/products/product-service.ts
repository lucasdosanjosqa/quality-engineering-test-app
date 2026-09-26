import type {
  ProductListQuery,
  ProductListResponse,
  ProductSummary,
} from '@commerceops/contracts';
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';

import type { AppDatabase } from '../db/client.js';
import { products } from '../db/schema.js';

const sortColumns = {
  name: products.name,
  sku: products.sku,
  price: products.priceCents,
  stock: products.stockQuantity,
  updatedAt: products.updatedAt,
} as const;

function toProductSummary(product: {
  id: string;
  sku: string;
  name: string;
  category: ProductSummary['category'];
  priceCents: number;
  stockQuantity: number;
  status: ProductSummary['status'];
  updatedAt: Date;
}): ProductSummary {
  return { ...product, updatedAt: product.updatedAt.toISOString() };
}

export class ProductService {
  constructor(private readonly database: AppDatabase) {}

  list(query: ProductListQuery): ProductListResponse {
    const conditions: SQL[] = [];
    if (query.search !== undefined && query.search !== '') {
      const normalizedSearch = query.search.toLowerCase();
      conditions.push(
        sql`(instr(lower(${products.name}), ${normalizedSearch}) > 0 or instr(lower(${products.sku}), ${normalizedSearch}) > 0)`,
      );
    }
    if (query.category !== undefined) {
      conditions.push(eq(products.category, query.category));
    }
    if (query.status !== undefined) {
      conditions.push(eq(products.status, query.status));
    }

    const where = conditions.length === 0 ? undefined : and(...conditions);
    const totalItems =
      this.database.select({ value: count() }).from(products).where(where).get()
        ?.value ?? 0;
    const totalPages = Math.ceil(totalItems / query.pageSize);
    const order = query.sortOrder === 'asc' ? asc : desc;
    const rows = this.database
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        category: products.category,
        priceCents: products.priceCents,
        stockQuantity: products.stockQuantity,
        status: products.status,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(where)
      .orderBy(order(sortColumns[query.sortBy]), asc(products.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)
      .all();

    return {
      items: rows.map(toProductSummary),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages,
      },
    };
  }
}
