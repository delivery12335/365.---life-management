import type { Category } from './index';
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  category: Category;
  description: string;
}
export interface HealthEntry {
  id: string;
  date: string;
  steps: number;
  stepGoal: number;
  water: number;
  waterGoal: number;
  sleep: number;
  exercise: number;
}
export const expenseCategories = [
  'Food',
  'Shopping',
  'Transport',
  'Subscriptions',
  'Entertainment',
  'Income',
  'Other',
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: ExpenseCategory;
  date: string;
}
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}
export type LifeEditor =
  | { kind: 'event'; item?: CalendarEvent; date?: string }
  | { kind: 'health'; item?: HealthEntry; date?: string }
  | { kind: 'transaction'; item?: Transaction };
