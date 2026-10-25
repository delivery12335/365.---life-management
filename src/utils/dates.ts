export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key: string): Date {
  return new Date(`${key}T12:00:00`);
}
export function shiftDay(key: string, amount: number): string {
  const d = parseDate(key);
  d.setDate(d.getDate() + amount);
  return dateKey(d);
}
export function weekDays(today: string): string[] {
  const d = parseDate(today);
  const monday = shiftDay(today, -(d.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
}
export function prettyDate(
  key: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return parseDate(key).toLocaleDateString('en-US', options);
}
