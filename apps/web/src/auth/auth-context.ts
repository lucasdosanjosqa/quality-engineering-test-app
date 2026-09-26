import type { AuthenticatedUser, LoginRequest } from '@commerceops/contracts';
import { createContext } from 'react';

export type AuthState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'authenticated'; user: AuthenticatedUser }
  | { status: 'error' };

export type AuthContextValue = {
  state: AuthState;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
