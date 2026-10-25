import { describe, expect, it } from 'vitest';
import type { AppData, Habit, Task } from '../types';
import { activities, dailyProgress, filterTasks, habitRate, streaks } from './statistics';
import { dateKey, shiftDay, weekDays } from './dates';
const today = '2026-10-25';
const habit: Habit = {
  id: 'h',
  name: 'Read',
  category: 'Personal',
  frequency: 'Daily',
  createdAt: '2026-10-20',
  history: ['2026-10-20', '2026-10-22', '2026-10-23', '2026-10-24'],
};
const task: Task = {
  id: 't',
  title: 'Portfolio',
  description: 'Design',
  category: 'Work',
  priority: 'High',
  dueDate: today,
  time: '',
  completed: false,
};
const data: AppData = { version: 1, name: 'Max', habits: [habit], tasks: [task], goals: [] };
describe('calendar dates', () => {
  it('uses local dates and crosses month boundaries', () => {
    expect(dateKey(new Date(2026, 9, 25))).toBe(today);
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('starts weeks on Monday including Sundays', () => {
    expect(weekDays(today)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      today,
    ]);
  });
});
describe('streaks', () => {
  it('keeps yesterday streak while today is pending', () => {
    expect(streaks(habit, today)).toEqual({ current: 3, longest: 3 });
  });
  it('increments today and resets after a missed day', () => {
    expect(streaks({ ...habit, history: [...habit.history, today] }, today).current).toBe(4);
    expect(streaks(habit, '2026-10-26').current).toBe(0);
  });
  it('skips weekends for weekday routines', () => {
    const h: Habit = {
      ...habit,
      frequency: 'Weekdays',
      createdAt: '2026-10-22',
      history: ['2026-10-22', '2026-10-23'],
    };
    expect(streaks(h, '2026-10-26')).toEqual({ current: 2, longest: 2 });
  });
  it('calculates rates only across eligible days', () => {
    expect(habitRate(habit, today)).toBe(67);
    expect(habitRate({ ...habit, createdAt: '2026-11-01' }, today)).toBe(0);
  });
});
describe('progress and analytics', () => {
  it('counts only scheduled activities for daily progress', () => {
    expect(dailyProgress(data, today)).toEqual({ total: 2, done: 0, percent: 0 });
    expect(
      dailyProgress({ ...data, tasks: [{ ...task, completed: true, completedAt: today }] }, today)
        .percent,
    ).toBe(50);
  });
  it('records tasks on actual completion date', () => {
    const d = {
      ...data,
      tasks: [{ ...task, dueDate: '2026-10-20', completed: true, completedAt: today }],
    };
    expect(activities(d, today)).toBe(1);
    expect(activities(d, '2026-10-20')).toBe(1);
  });
  it('handles empty workspaces', () => {
    expect(dailyProgress({ ...data, habits: [], tasks: [] }, today)).toEqual({
      total: 0,
      done: 0,
      percent: 0,
    });
  });
});
describe('task filters', () => {
  const tasks: Task[] = [
    task,
    { ...task, id: 'upcoming', dueDate: '2026-10-26', priority: 'Low' },
    {
      ...task,
      id: 'done',
      completed: true,
      category: 'Study',
      dueDate: '2026-10-24',
      priority: 'Medium',
    },
  ];
  it('filters today, upcoming and completed', () => {
    expect(filterTasks(tasks, 'Today', '', 'date', today).map((t) => t.id)).toEqual(['t']);
    expect(filterTasks(tasks, 'Upcoming', '', 'date', today).map((t) => t.id)).toEqual([
      'upcoming',
    ]);
    expect(filterTasks(tasks, 'Completed', '', 'date', today).map((t) => t.id)).toEqual(['done']);
  });
  it('searches case-insensitively and sorts by priority/category', () => {
    expect(filterTasks(tasks, 'All', 'STUDY', 'date', today).map((t) => t.id)).toEqual(['done']);
    expect(filterTasks(tasks, 'All', '', 'priority', today).map((t) => t.id)).toEqual([
      't',
      'done',
      'upcoming',
    ]);
    expect(filterTasks(tasks, 'All', '', 'category', today)[0].id).toBe('done');
  });
});
