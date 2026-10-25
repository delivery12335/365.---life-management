import type { AppData, Habit, Task } from '../types';
import { parseDate, shiftDay } from './dates';
export function isScheduled(habit: Habit, day: string): boolean {
  const weekday = parseDate(day).getDay();
  return day >= habit.createdAt && (habit.frequency === 'Daily' || (weekday > 0 && weekday < 6));
}
export function streaks(habit: Habit, today: string) {
  const history = new Set(habit.history.filter((d) => d <= today && isScheduled(habit, d)));
  let longest = 0,
    run = 0;
  for (let d = habit.createdAt; d <= today; d = shiftDay(d, 1)) {
    if (!isScheduled(habit, d)) continue;
    run = history.has(d) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let cursor = today;
  if (!history.has(cursor)) cursor = shiftDay(cursor, -1);
  for (; cursor >= habit.createdAt; cursor = shiftDay(cursor, -1)) {
    if (!isScheduled(habit, cursor)) continue;
    if (!history.has(cursor)) break;
    current++;
  }
  return { current, longest };
}
export function activities(data: AppData, day: string): number {
  return (
    data.habits.filter((h) => h.history.includes(day)).length +
    data.tasks.filter((t) => t.completed && t.completedAt === day).length
  );
}
export function dailyProgress(data: AppData, day: string) {
  const habits = data.habits.filter((h) => isScheduled(h, day));
  const tasks = data.tasks.filter((t) => t.dueDate === day);
  const total = habits.length + tasks.length;
  const done =
    habits.filter((h) => h.history.includes(day)).length + tasks.filter((t) => t.completed).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
export function habitRate(habit: Habit, today: string, days = 7): number {
  const dates = Array.from({ length: days }, (_, i) => shiftDay(today, -i)).filter((d) =>
    isScheduled(habit, d),
  );
  return dates.length
    ? Math.round((dates.filter((d) => habit.history.includes(d)).length / dates.length) * 100)
    : 0;
}
export function filterTasks(
  tasks: Task[],
  filter: string,
  query: string,
  sort: string,
  today: string,
): Task[] {
  const rank = { High: 0, Medium: 1, Low: 2 };
  return tasks
    .filter(
      (t) =>
        (filter === 'All' ||
          (filter === 'Today' && t.dueDate === today) ||
          (filter === 'Upcoming' && t.dueDate > today && !t.completed) ||
          (filter === 'Completed' && t.completed)) &&
        `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'priority'
        ? rank[a.priority] - rank[b.priority]
        : sort === 'category'
          ? a.category.localeCompare(b.category)
          : a.dueDate.localeCompare(b.dueDate),
    );
}
