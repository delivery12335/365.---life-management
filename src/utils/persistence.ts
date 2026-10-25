import type { AppData } from '../types';
import { emptyData } from '../data/emptyData';
import { extendData } from './life';

export function readData(raw: string | null): AppData {
  if (!raw) return emptyData();
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('tasks' in value) ||
    !Array.isArray(value.tasks) ||
    !('habits' in value) ||
    !Array.isArray(value.habits) ||
    !('goals' in value) ||
    !Array.isArray(value.goals)
  )
    throw new Error('Invalid saved data');
  const data = value as AppData;
  return extendData({ ...data, name: typeof data.name === 'string' ? data.name : '' });
}

// Only the old release's reserved seed IDs are removed. User-created IDs are retained.
export function migrateLegacyData(data: AppData): AppData {
  return extendData({
    ...data,
    name: data.name === 'Max' ? '' : data.name,
    tasks: data.tasks.filter((item) => !/^t[1-4]$|^past(?:[0-9]|1[0-9]|2[01])$/.test(item.id)),
    habits: data.habits.filter((item) => !/^h[0-3]$/.test(item.id)),
    goals: data.goals.filter((item) => !/^g[1-3]$/.test(item.id)),
    events: (data.events ?? []).filter(
      (item) => !/^event-(study|portfolio|gym|next)$/.test(item.id),
    ),
    health: (data.health ?? []).filter((item) => !/^health-demo-\d+$/.test(item.id)),
    transactions: (data.transactions ?? []).filter(
      (item) => !/^tx-(salary|groceries|coffee|spotify|shopping|travel|cinema)$/.test(item.id),
    ),
    notes: (data.notes ?? []).filter((item) => !/^note-(ideas|shopping|learn)$/.test(item.id)),
  });
}
