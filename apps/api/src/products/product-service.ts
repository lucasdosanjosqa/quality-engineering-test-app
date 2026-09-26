import { randomUUID } from 'node:crypto';

import type {
  ProductDetail,
  ProductInput,
  ProductListQuery,
  ProductListResponse,
  ProductSummary,
} from '@commerceops/contracts';
import { and, asc, count, desc, eq, ne, sql, type SQL } from 'drizzle-orm';

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

function toProductDetail(product: typeof products.$inferSelect): ProductDetail {
  return {
    ...toProductSummary(product),
    description: product.description,
    createdAt: product.createdAt.toISOString(),
  };
}

export class ProductService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

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

  get(id: string): ProductDetail | undefined {
    const product = this.database
      .select()
      .from(products)
      .where(eq(products.id, id))
      .get();
    return product === undefined ? undefined : toProductDetail(product);
  }

  create(input: ProductInput): ProductDetail | undefined {
    if (this.hasSku(input.sku)) return undefined;
    const timestamp = this.now();
    const product = {
      id: this.createId(),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.database.insert(products).values(product).run();
    return toProductDetail(product);
  }

  update(
    id: string,
    input: ProductInput,
  ): ProductDetail | 'sku-conflict' | undefined {
    if (this.get(id) === undefined) return undefined;
    if (this.hasSku(input.sku, id)) return 'sku-conflict';
    this.database
      .update(products)
      .set({ ...input, updatedAt: this.now() })
      .where(eq(products.id, id))
      .run();
    return this.get(id);
  }

  delete(id: string): boolean {
    return (
      this.database.delete(products).where(eq(products.id, id)).run().changes >
      0
    );
  }

  private hasSku(sku: string, excludedId?: string): boolean {
    const condition =
      excludedId === undefined
        ? eq(products.sku, sku)
        : and(eq(products.sku, sku), ne(products.id, excludedId));
    return (
      this.database
        .select({ id: products.id })
        .from(products)
        .where(condition)
        .get() !== undefined
    );
  }
}
