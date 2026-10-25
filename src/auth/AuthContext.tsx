import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import { staticPreview } from '../config';
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async () => {
    if (staticPreview) {
      setLoading(false);
      return;
    }
    try {
      const result = await api<{ user: AuthUser | null }>('/api/auth/session');
      setUser(result.user);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const expired = () => setUser(null);
    window.addEventListener('365:session-expired', expired);
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('365.auth');
      channel.current.onmessage = () => {
        void refresh();
      };
    }
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('365:session-expired', expired);
      document.removeEventListener('visibilitychange', visible);
      channel.current?.close();
    };
  }, [refresh]);
  async function authenticate(path: string, body: unknown) {
    const result = await api<{ user: AuthUser }>(path, { method: 'POST', body });
    setUser(result.user);
    setError(false);
    channel.current?.postMessage('changed');
  }
  async function signOut() {
    await api('/api/auth/logout', { method: 'POST', body: {} });
    setUser(null);
    channel.current?.postMessage('changed');
  }
  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        refresh,
        login: (email, password, remember = false) =>
          authenticate('/api/auth/login', { email, password, remember }),
        register: (name, email, password) =>
          authenticate('/api/auth/register', { name, email, password }),
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
