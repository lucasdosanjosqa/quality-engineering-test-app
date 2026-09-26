import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'viewer']);

export const authenticatedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: userRoleSchema,
});

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const authResponseSchema = z.object({
  user: authenticatedUserSchema,
});

export const adminSummaryResponseSchema = z.object({
  users: z.number().int().nonnegative(),
  products: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative(),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AdminSummaryResponse = z.infer<typeof adminSummaryResponseSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
