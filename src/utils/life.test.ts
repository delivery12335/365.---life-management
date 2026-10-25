import { describe, it, expect } from 'vitest';
import { financeSummary, extendData, percent } from './life';
import type { AppData } from '../types';
import type { Transaction } from '../types/life';
const legacy: AppData = { version: 1, name: 'Max', tasks: [], habits: [], goals: [] };
describe('365 data extension', () => {
  it('adds new sections while keeping existing records and references', () => {
    const task = {
      id: 'old',
      title: 'Keep me',
      description: '',
      category: 'Work' as const,
      priority: 'High' as const,
      dueDate: '2026-10-25',
      time: '',
      completed: false,
    };
    const old = { ...legacy, tasks: [task] };
    const next = extendData(old);
    expect(next.tasks).toBe(old.tasks);
    expect(next.tasks[0]).toEqual(task);
    expect(next.events).toEqual([]);
    expect(next.health).toEqual([]);
    expect(next.notes).toEqual([]);
  });
  it('never reseeds intentionally empty sections', () => {
    const saved = {
      ...legacy,
      events: [],
      health: [],
      transactions: [],
      notes: [],
      openingBalance: 20,
    };
    const next = extendData(saved);
    expect(next.events).toEqual([]);
    expect(next.notes).toEqual([]);
    expect(next.openingBalance).toBe(20);
    expect(extendData(next)).toEqual(next);
  });
});
describe('manual finance totals', () => {
  const tx: Transaction[] = [
    {
      id: '1',
      title: 'Salary',
      date: '2026-10-01',
      type: 'income',
      amount: 1800,
      category: 'Income',
    },
    {
      id: '2',
      title: 'Food',
      date: '2026-10-02',
      type: 'expense',
      amount: 559.5,
      category: 'Food',
    },
    {
      id: '3',
      title: 'Earlier expense',
      date: '2026-09-30',
      type: 'expense',
      amount: 100,
      category: 'Other',
    },
  ];
  it('distinguishes all-time balance and selected-month net savings', () => {
    expect(financeSummary(tx, '2026-10', 20)).toEqual({
      balance: 1160.5,
      income: 1800,
      spent: 559.5,
      savings: 1240.5,
    });
  });
  it('calculates empty months without hiding the real balance', () => {
    expect(financeSummary(tx, '2026-11').income).toBe(0);
    expect(financeSummary(tx, '2026-11').balance).toBe(1140.5);
  });
});
describe('progress rings', () => {
  it('clamps values and handles zero targets', () => {
    expect(percent(6240, 10000)).toBe(62);
    expect(percent(12000, 10000)).toBe(100);
    expect(percent(-1, 10)).toBe(0);
    expect(percent(10, 0)).toBe(0);
  });
});
