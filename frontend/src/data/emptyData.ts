import type { AppData } from '../types';

export function emptyData(): AppData {
  return {
    version: 1,
    name: '',
    tasks: [],
    habits: [],
    goals: [],
    events: [],
    health: [],
    transactions: [],
    notes: [],
    openingBalance: 0,
  };
}
