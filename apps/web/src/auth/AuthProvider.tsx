import type { LoginRequest } from '@commerceops/contracts';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ApiError,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '../api/client';
import { AuthContext, type AuthState } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getCurrentUser(controller.signal)
      .then((user) => setState({ status: 'authenticated', user }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState(
          error instanceof ApiError && error.status === 401
            ? { status: 'guest' }
            : { status: 'error' },
        );
      });

    return () => controller.abort();
  }, [refreshKey]);

  const login = useCallback(async (input: LoginRequest) => {
    const user = await loginRequest(input);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setState({ status: 'guest' });
  }, []);

  const refresh = useCallback(() => {
    setState({ status: 'loading' });
    setRefreshKey((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({ state, login, logout, refresh }),
    [state, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
