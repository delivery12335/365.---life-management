import type { AppData } from '../types';
import type { HealthEntry, Transaction } from '../types/life';
export function extendData(data: AppData): AppData {
  return {
    ...data,
    events: data.events ?? [],
    health: data.health ?? [],
    transactions: data.transactions ?? [],
    notes: data.notes ?? [],
    openingBalance: data.openingBalance ?? 0,
  };
}
export function wellnessFor(data: AppData, date: string): HealthEntry | undefined {
  return data.health?.find((entry) => entry.date === date);
}
export function financeSummary(transactions: Transaction[], month: string, openingBalance = 0) {
  const monthly = transactions.filter((t) => t.date.slice(0, 7) === month);
  const income = monthly.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const spent = monthly.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance =
    openingBalance +
    transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  return { income, spent, balance, savings: income - spent };
}
export function percent(value: number, target: number) {
  return target > 0 ? Math.min(100, Math.max(0, Math.round((value / target) * 100))) : 0;
}
export function sleepText(value: number) {
  const minutes = Math.round(value * 60);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
