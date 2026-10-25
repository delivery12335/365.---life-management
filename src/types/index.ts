import type { CalendarEvent, HealthEntry, Note, Transaction } from './life';
export const categories = ['Personal', 'Study', 'Work', 'Health'] as const;
export type Category = (typeof categories)[number];
export type Page =
  | 'Overview'
  | 'Habits'
  | 'Tasks'
  | 'Goals'
  | 'Analytics'
  | 'Settings'
  | 'Calendar'
  | 'Health'
  | 'Finance'
  | 'Notes';
export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  time: string;
  completed: boolean;
  completedAt?: string;
}
export interface Habit {
  id: string;
  name: string;
  category: Category;
  frequency: 'Daily' | 'Weekdays';
  createdAt: string;
  history: string[];
}
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: Category;
  current: number;
  target: number;
  deadline: string;
  unit: string;
}
export interface AppData {
  events?: CalendarEvent[];
  health?: HealthEntry[];
  transactions?: Transaction[];
  notes?: Note[];
  openingBalance?: number;
  version: 1;
  name: string;
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
}
export type Editor =
  | { kind: 'task'; item?: Task }
  | { kind: 'habit'; item?: Habit }
  | { kind: 'goal'; item?: Goal }
  | { kind: 'choose' };
