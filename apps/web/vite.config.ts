import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

function readPort(
  value: string | undefined,
  name: string,
  fallback: number,
): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }

  return port;
}

function readHost(
  value: string | undefined,
  name: string,
  fallback: string,
): string {
  const host = value || fallback;
  if (host.trim() !== host || host.length === 0) {
    throw new Error(
      `${name} must be a non-empty host without surrounding whitespace.`,
    );
  }

  return host;
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '../../', '');
  const apiHost = readHost(environment.API_HOST, 'API_HOST', '127.0.0.1');
  const apiPort = readPort(environment.API_PORT, 'API_PORT', 3000);
  const webHost = readHost(environment.WEB_HOST, 'WEB_HOST', '127.0.0.1');
  const webPort = readPort(environment.WEB_PORT, 'WEB_PORT', 5173);

  return {
    envDir: '../../',
    plugins: [react()],
    server: {
      host: webHost,
      port: webPort,
      strictPort: true,
      proxy: {
        '/api': `http://${apiHost}:${apiPort}`,
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  };
});
