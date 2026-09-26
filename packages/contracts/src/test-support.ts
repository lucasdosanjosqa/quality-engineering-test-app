import { z } from 'zod';

export const resetResponseSchema = z.object({
  status: z.literal('reset'),
  data: z.object({
    users: z.literal(2),
    products: z.literal(12),
    sessions: z.literal(0),
  }),
});

export const testFaultTargetSchema = z.enum([
  'products.list',
  'products.detail',
  'products.write',
]);

export const testFaultRequestSchema = z.object({
  target: testFaultTargetSchema,
  enabled: z.boolean(),
});

export const testFaultStateSchema = z.object({
  faults: z.object({
    'products.list': z.boolean(),
    'products.detail': z.boolean(),
    'products.write': z.boolean(),
  }),
});

export type ResetResponse = z.infer<typeof resetResponseSchema>;
export type TestFaultTarget = z.infer<typeof testFaultTargetSchema>;
export type TestFaultRequest = z.infer<typeof testFaultRequestSchema>;
export type TestFaultState = z.infer<typeof testFaultStateSchema>;
