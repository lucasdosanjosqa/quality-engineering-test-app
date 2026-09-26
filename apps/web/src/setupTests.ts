import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const originalFetch = globalThis.fetch;
