import { createClient, type User } from '@supabase/supabase-js';
import { cloudUrl, cloudKey } from '../config';
import { ApiError } from './errors';

const rememberKey = '365:cloud:remember';
const storage = {
  getItem: (key: string) => sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem(key: string, value: string) {
    const persistent = localStorage.getItem(rememberKey) === 'true';
    (persistent ? sessionStorage : localStorage).removeItem(key);
    (persistent ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem(key: string) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },
};
export const cloud = createClient(cloudUrl, cloudKey, {
  auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
export const cloudUser = (user: User) => ({
  id: user.id,
  email: user.email ?? '',
  name: String(user.user_metadata?.name ?? ''),
});
cloud.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    history.replaceState(
      null,
      '',
      `${location.pathname}${location.search}#reset-password?token=cloud`,
    );
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
});
function check(error: { code?: string; message?: string; status?: number } | null) {
  if (!error) return;
  const code = error.code ?? '';
  const message = error.message ?? '';
  if (/sending (confirmation|recovery) email/i.test(message))
    throw new ApiError('email_delivery_unavailable');
  if (message.includes('data_conflict')) throw new ApiError('data_conflict', 409);
  if (message.includes('invalid_data')) throw new ApiError('invalid_data', 400);
  const mapped: Record<string, string> = {
    invalid_credentials: 'invalid_credentials',
    email_not_confirmed: 'confirmation_required',
    user_already_exists: 'email_exists',
    weak_password: 'invalid_registration',
    over_request_rate_limit: 'too_many_attempts',
    over_email_send_rate_limit: 'too_many_attempts',
    email_address_not_authorized: 'email_delivery_unavailable',
  };
  throw new ApiError(mapped[code] ?? 'server_error', error.status);
}
export async function cloudApi(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accountId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<unknown> {
  const body = (options.body ?? {}) as Record<string, unknown>;
  if (path === '/api/auth/session') {
    const { data: session, error: sessionError } = await cloud.auth.getSession();
    check(sessionError);
    if (!session.session) return { user: null };
    const { data, error } = await cloud.auth.getUser();
    if (error?.status === 401 || error?.status === 403) {
      await cloud.auth.signOut({ scope: 'local' });
      return { user: null };
    }
    check(error);
    return { user: data.user ? cloudUser(data.user) : null };
  }
  if (path === '/api/auth/login' || path === '/api/auth/register') {
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    if (
      path.endsWith('/register') &&
      (!name || name.length > 40 || password.length < 10 || password.length > 128)
    )
      throw new ApiError('invalid_registration', 400);
    localStorage.setItem(rememberKey, String(body.remember === true));
    const result = path.endsWith('/login')
      ? await cloud.auth.signInWithPassword({ email, password })
      : await cloud.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: `${location.origin}${location.pathname}` },
        });
    check(result.error);
    if (!result.data.session) throw new ApiError('confirmation_required');
    return { user: cloudUser(result.data.user!) };
  }
  if (path === '/api/auth/logout') {
    const { error } = await cloud.auth.signOut({ scope: 'local' });
    check(error);
    return { ok: true };
  }
  if (path === '/api/auth/forgot-password') {
    const { error } = await cloud.auth.resetPasswordForEmail(String(body.email ?? ''), {
      redirectTo: `${location.origin}${location.pathname}`,
    });
    check(error);
    return { ok: true, delivery: 'email' };
  }
  if (path === '/api/auth/reset-password') {
    const password = String(body.password ?? '');
    if (password.length < 10 || password.length > 128) throw new ApiError('invalid_reset', 400);
    const { error } = await cloud.auth.updateUser({ password });
    check(error);
    const result = await cloud.auth.signOut({ scope: 'global' });
    check(result.error);
    return { ok: true };
  }
  if (path === '/api/data') {
    const {
      data: { user },
      error,
    } = await cloud.auth.getUser();
    check(error);
    if (!user) {
      window.dispatchEvent(new Event('365:session-expired'));
      throw new ApiError('unauthorized', 401);
    }
    if (user.id !== options.accountId) throw new ApiError('unauthorized', 403);
    const query =
      options.method === 'PUT'
        ? cloud.rpc('save_365_data', { p_data: body.data, p_revision: body.revision })
        : cloud.rpc('load_365_data');
    const result = await (options.signal ? query.abortSignal(options.signal) : query);
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    check(result.error);
    return result.data;
  }
  throw new ApiError('server_error', 404);
}
