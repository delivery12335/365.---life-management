import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => {
  const auth = { onAuthStateChange: vi.fn(), getUser: vi.fn(), getSession: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn() };
  return { auth, rpc: vi.fn(), createClient: vi.fn(), client: { auth, rpc: vi.fn() } };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: mock.createClient }));
vi.mock('../config', () => ({ cloudUrl: 'https://unit-test.supabase.co', cloudKey: 'sb_publishable_test' }));

const fakeStorage = () => {
  const entries = new Map<string, string>();
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) };
};
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubGlobal('localStorage', fakeStorage());
  vi.stubGlobal('sessionStorage', fakeStorage());
  vi.stubGlobal('location', { origin: 'https://example.test', pathname: '/365/' });
  mock.createClient.mockReturnValue(mock.client);
  mock.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner', email: 'owner@example.test', user_metadata: { name: 'Owner' } } }, error: null });
  mock.auth.signOut.mockResolvedValue({ error: null });
});

describe('cloud account adapter', () => {
  it('rejects a stale save for a different account before invoking the database', async () => {
    const { cloudApi } = await import('./cloud');
    await expect(cloudApi('/api/data', { method: 'PUT', accountId: 'other', body: {} })).rejects.toMatchObject({ status: 403 });
    expect(mock.client.rpc).not.toHaveBeenCalled();
  });
  it('preserves revision conflicts from the database', async () => {
    mock.client.rpc.mockResolvedValue({ data: null, error: { message: 'data_conflict', code: '40001' } });
    const { cloudApi } = await import('./cloud');
    await expect(cloudApi('/api/data', { method: 'PUT', accountId: 'owner', body: { data: {}, revision: 2 } })).rejects.toMatchObject({ code: 'data_conflict', status: 409 });
    expect(mock.client.rpc).toHaveBeenCalledWith('save_365_data', { p_data: {}, p_revision: 2 });
  });
  it('does not fake a signed-in session when email confirmation is required', async () => {
    mock.auth.signUp.mockResolvedValue({ data: { session: null, user: { id: 'owner' } }, error: null });
    const { cloudApi } = await import('./cloud');
    await expect(cloudApi('/api/auth/register', { body: { name: 'Owner', email: 'owner@example.test', password: 'long-password' } })).rejects.toMatchObject({ code: 'confirmation_required' });
  });
  it('stores auth tokens in the chosen storage without caching personal records', async () => {
    await import('./cloud');
    const storage = mock.createClient.mock.calls[0][2].auth.storage;
    storage.setItem('session', 'token');
    expect(sessionStorage.getItem('session')).toBe('token');
    expect(localStorage.getItem('session')).toBeNull();
    localStorage.setItem('365:cloud:remember', 'true');
    storage.setItem('session', 'renewed-token');
    expect(localStorage.getItem('session')).toBe('renewed-token');
    expect(sessionStorage.getItem('session')).toBeNull();
    storage.removeItem('session');
    expect(storage.getItem('session')).toBeNull();
  });
  it('loads only through the owner-scoped RPC', async () => {
    mock.client.rpc.mockResolvedValue({ data: { data: { tasks: [] }, revision: 0 }, error: null });
    const { cloudApi } = await import('./cloud');
    expect(await cloudApi('/api/data', { accountId: 'owner' })).toEqual({ data: { tasks: [] }, revision: 0 });
    expect(mock.client.rpc).toHaveBeenCalledWith('load_365_data');
  });
});
