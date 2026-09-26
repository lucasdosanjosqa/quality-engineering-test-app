import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const section =
      pathname === '/login'
        ? 'Sign in'
        : pathname === '/dashboard'
          ? 'Dashboard'
          : pathname === '/admin'
            ? 'Admin'
            : pathname.startsWith('/products')
              ? 'Products'
              : 'Page not found';
    document.title = `${section} | CommerceOps`;
  }, [pathname]);

  return null;
}
