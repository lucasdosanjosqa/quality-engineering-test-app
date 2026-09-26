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

export const productDetailSchema = productSummarySchema.extend({
  description: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const productInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(500),
  category: productCategorySchema,
  priceCents: z.number().int().min(0).max(10_000_000),
  stockQuantity: z.number().int().min(0).max(100_000),
  status: productStatusSchema,
});

export const productResponseSchema = z.object({ product: productDetailSchema });

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
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
