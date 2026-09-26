import {
  adminSummaryResponseSchema,
  authResponseSchema,
  errorResponseSchema,
  productListResponseSchema,
  type AdminSummaryResponse,
  type AuthenticatedUser,
  type LoginRequest,
  type ProductListQuery,
  type ProductListResponse,
} from '@commerceops/contracts';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(init?.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(await response.json());
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.code : 'UNEXPECTED_RESPONSE',
      parsed.success
        ? parsed.data.error.message
        : 'The server returned an unexpected response.',
    );
  }

  return response;
}

export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<AuthenticatedUser> {
  const response = await request('/api/auth/me', { signal });
  return authResponseSchema.parse(await response.json()).user;
}

export async function login(input: LoginRequest): Promise<AuthenticatedUser> {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return authResponseSchema.parse(await response.json()).user;
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
}

export async function getAdminSummary(
  signal?: AbortSignal,
): Promise<AdminSummaryResponse> {
  const response = await request('/api/admin/summary', { signal });
  return adminSummaryResponseSchema.parse(await response.json());
}

export async function getProducts(
  query: ProductListQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.search !== undefined && query.search !== '') {
    parameters.set('search', query.search);
  }
  if (query.category !== undefined) {
    parameters.set('category', query.category);
  }
  if (query.status !== undefined) {
    parameters.set('status', query.status);
  }

  const response = await request(`/api/products?${parameters.toString()}`, {
    signal,
  });
  return productListResponseSchema.parse(await response.json());
}
