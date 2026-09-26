import { z } from 'zod';

export const productCategorySchema = z.enum([
  'accessories',
  'audio',
  'keyboards',
  'monitors',
  'workspace',
]);

export const productStatusSchema = z.enum(['active', 'inactive']);

export const productSortFieldSchema = z.enum([
  'name',
  'sku',
  'price',
  'stock',
  'updatedAt',
]);

export const productListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: productCategorySchema.optional(),
  status: productStatusSchema.optional(),
  sortBy: productSortFieldSchema.default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
});

export const productSummarySchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
  category: productCategorySchema,
  priceCents: z.number().int().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  status: productStatusSchema,
  updatedAt: z.string().datetime(),
});

export const productListResponseSchema = z.object({
  items: z.array(productSummarySchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type ProductSortField = z.infer<typeof productSortFieldSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
