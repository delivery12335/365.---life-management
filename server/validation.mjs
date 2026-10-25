const categories = new Set(['Personal', 'Study', 'Work', 'Health']);
const expenseCategories = new Set([
  'Food',
  'Shopping',
  'Transport',
  'Subscriptions',
  'Entertainment',
  'Income',
  'Other',
]);
const object = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max) => typeof value === 'string' && value.length <= max;
const number = (value, max = 1e9) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
const day = (value) =>
  text(value, 10) &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) &&
  new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const time = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const optionalDay = (value) => value === '' || day(value);
const timestamp = (value) => text(value, 40) && !Number.isNaN(Date.parse(value));
const base = (value) => object(value) && text(value.id, 100) && value.id.length > 0;
const array = (value, validate) =>
  Array.isArray(value) &&
  value.length <= 10000 &&
  new Set(value.map((v) => v?.id)).size === value.length &&
  value.every(validate);
export function emptyAccount(name) {
  return {
    version: 1,
    name,
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
export function validData(data) {
  return (
    object(data) &&
    data.version === 1 &&
    text(data.name, 40) &&
    number(data.openingBalance ?? 0) &&
    array(
      data.tasks,
      (t) =>
        base(t) &&
        text(t.title, 120) &&
        t.title.trim().length > 0 &&
        text(t.description, 1000) &&
        categories.has(t.category) &&
        ['Low', 'Medium', 'High'].includes(t.priority) &&
        day(t.dueDate) &&
        (t.time === '' || time(t.time)) &&
        typeof t.completed === 'boolean' &&
        (t.completedAt === undefined || day(t.completedAt)),
    ) &&
    array(
      data.habits,
      (h) =>
        base(h) &&
        text(h.name, 120) &&
        h.name.trim().length > 0 &&
        categories.has(h.category) &&
        ['Daily', 'Weekdays'].includes(h.frequency) &&
        day(h.createdAt) &&
        Array.isArray(h.history) &&
        h.history.length <= 20000 &&
        h.history.every(day) &&
        new Set(h.history).size === h.history.length,
    ) &&
    array(
      data.goals,
      (g) =>
        base(g) &&
        text(g.title, 120) &&
        text(g.description, 1000) &&
        categories.has(g.category) &&
        number(g.current) &&
        number(g.target) &&
        g.target > 0 &&
        g.current <= g.target &&
        optionalDay(g.deadline) &&
        text(g.unit, 30),
    ) &&
    array(
      data.events ?? [],
      (e) =>
        base(e) &&
        text(e.title, 120) &&
        e.title.trim().length > 0 &&
        day(e.date) &&
        time(e.start) &&
        time(e.end) &&
        e.end > e.start &&
        categories.has(e.category) &&
        text(e.description, 2000),
    ) &&
    array(
      data.health ?? [],
      (h) =>
        base(h) &&
        day(h.date) &&
        Number.isInteger(h.steps) &&
        number(h.steps, 1e6) &&
        Number.isInteger(h.stepGoal) &&
        number(h.stepGoal, 1e6) &&
        h.stepGoal > 0 &&
        number(h.water, 100) &&
        number(h.waterGoal, 100) &&
        h.waterGoal > 0 &&
        number(h.sleep, 24) &&
        number(h.exercise, 1440),
    ) &&
    new Set((data.health ?? []).map((h) => h.date)).size === (data.health ?? []).length &&
    array(
      data.transactions ?? [],
      (t) =>
        base(t) &&
        text(t.title, 120) &&
        t.title.trim().length > 0 &&
        number(t.amount) &&
        t.amount > 0 &&
        ['income', 'expense'].includes(t.type) &&
        expenseCategories.has(t.category) &&
        day(t.date),
    ) &&
    array(
      data.notes ?? [],
      (n) =>
        base(n) &&
        text(n.title, 160) &&
        text(n.content, 50000) &&
        timestamp(n.createdAt) &&
        timestamp(n.updatedAt) &&
        typeof n.pinned === 'boolean',
    )
  );
}
