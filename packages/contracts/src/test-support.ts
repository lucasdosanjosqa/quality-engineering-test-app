import { z } from 'zod';

export const resetResponseSchema = z.object({
  status: z.literal('reset'),
  data: z.object({
    users: z.literal(2),
    products: z.literal(12),
    sessions: z.literal(0),
  }),
});

export type ResetResponse = z.infer<typeof resetResponseSchema>;
