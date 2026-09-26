import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading and then the validated API status', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    vi.spyOn(globalThis, 'fetch').mockReturnValue(pendingResponse);

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking API availability',
    );

    await act(async () => {
      resolveResponse?.(
        jsonResponse({ status: 'ok', service: 'commerceops-api' }),
      );
      await pendingResponse;
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'API available: commerceops-api',
    );
  });

  it('shows an accessible error when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Network failure'),
    );

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The API is unavailable',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('retries the health check after an error', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce(
        jsonResponse({ status: 'ok', service: 'commerceops-api' }),
      );

    render(<App />);

    const retryButton = await screen.findByRole('button', {
      name: 'Try again',
    });
    retryButton.click();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'API available: commerceops-api',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
