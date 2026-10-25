import { ApiError } from './errors';
import { cloudEnabled } from '../config';
export { ApiError } from './errors';
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; accountId?: string; signal?: AbortSignal } = {},
): Promise<T> {
  if (cloudEnabled) {
    const { cloudApi } = await import('./cloud');
    return cloudApi(path, options) as Promise<T>;
  }
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      signal: options.signal,
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.method && options.method !== 'GET' ? { 'X-365-Request': '1' } : {}),
        ...(options.accountId ? { 'X-Account-ID': options.accountId } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('network_error');
  }
  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    if (response.status === 401 && !path.endsWith('/login'))
      window.dispatchEvent(new Event('365:session-expired'));
    throw new ApiError(result.error ?? 'server_error', response.status);
  }
  return result as T;
}
