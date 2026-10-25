import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import type { AppData } from '../types';
import { emptyData } from '../data/emptyData';
import { api, ApiError } from '../auth/api';

export function useUserData(userId: string) {
  const [data, update] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(data);
  const saved = useRef('');
  const revision = useRef(0);
  const ready = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef<Promise<void> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const abort = new AbortController();
    api<{ data: AppData; revision: number }>('/api/data', {
      accountId: userId,
      signal: abort.signal,
    })
      .then((result) => {
        if (!mounted.current || abort.signal.aborted) return;
        latest.current = result.data;
        saved.current = JSON.stringify(result.data);
        revision.current = result.revision;
        ready.current = true;
        update(result.data);
        setLoading(false);
        setError('');
      })
      .catch((error) => {
        if (abort.signal.aborted) return;
        setLoading(false);
        setError(error instanceof ApiError ? error.code : 'server_error');
      });
    return () => {
      mounted.current = false;
      ready.current = false;
      abort.abort();
      controller.current?.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId]);

  const flush = useCallback(async (): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (active.current) {
      await active.current;
      return flush();
    }
    if (!ready.current) throw new ApiError('save_error');
    if (blocked.current) throw new ApiError('data_conflict');
    if (JSON.stringify(latest.current) === saved.current) return;
    const work = (async () => {
      if (mounted.current) setSaving(true);
      try {
        while (mounted.current && JSON.stringify(latest.current) !== saved.current) {
          const snapshot = JSON.stringify(latest.current);
          controller.current = new AbortController();
          const response = await api<{ revision: number }>('/api/data', {
            method: 'PUT',
            accountId: userId,
            body: { data: JSON.parse(snapshot), revision: revision.current },
            signal: controller.current.signal,
          });
          revision.current = response.revision;
          saved.current = snapshot;
        }
        if (mounted.current) setError('');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'data_conflict') blocked.current = true;
        if (mounted.current) setError(error instanceof ApiError ? error.code : 'save_error');
        throw error;
      } finally {
        active.current = null;
        if (mounted.current) setSaving(false);
      }
    })();
    active.current = work;
    return work;
  }, [userId]);

  const setData = useCallback(
    (action: SetStateAction<AppData>) => {
      if (!ready.current) return;
      const next = typeof action === 'function' ? action(latest.current) : action;
      latest.current = next;
      update(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush().catch(() => {});
      }, 250);
    },
    [flush],
  );
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (ready.current && JSON.stringify(latest.current) !== saved.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, []);
  return { data, setData, loading, saving, error, loaded: ready.current, flush };
}
