import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Category } from './types';
export type Language = 'en' | 'ru';
export const LANGUAGE_KEY = 'lifetrack.language';
const en = {
  today: 'Today',
  habits: 'Habits',
  goals: 'Goals',
  add: 'Add',
  task: 'Task',
  habit: 'Habit',
  goal: 'Goal',
  language: 'Language',
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  progress: "Today's progress",
  completed: 'completed',
  of: 'of',
  addTask: 'Add task',
  taskPlaceholder: 'What do you need to do?',
  cancel: 'Cancel',
  save: 'Save',
  edit: 'Edit',
  delete: 'Delete',
  close: 'Close',
  complete: 'Complete',
  uncomplete: 'Mark incomplete',
  viewHabits: 'View all habits',
  noTasks: 'Nothing planned for today.',
  noTasksHint: 'Add a task when you’re ready.',
  noHabits: 'No habits yet',
  noHabitsHint: 'Start with one small habit.',
  noGoals: 'No goals yet',
  noGoalsHint: 'Give yourself something to work toward.',
  habitsSubtitle: 'A little consistency, one day at a time.',
  goalsSubtitle: 'Make room for what matters to you.',
  newHabit: 'Add habit',
  newGoal: 'Add goal',
  currentStreak: 'Current streak',
  previousWeek: 'Previous week',
  nextWeek: 'Next week',
  thisWeek: 'This week',
  title: 'Name',
  habitName: 'Habit name',
  category: 'Category',
  frequency: 'Repeat',
  daily: 'Every day',
  weekdays: 'Weekdays',
  details: 'More details',
  description: 'Notes',
  priority: 'Priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  dueDate: 'Date',
  time: 'Time (optional)',
  deadline: 'Deadline (optional)',
  current: 'Current progress',
  target: 'Target',
  unit: 'Unit',
  steps: 'steps',
  newTask: 'Add task',
  editTask: 'Edit task',
  editHabit: 'Edit habit',
  editGoal: 'Edit goal',
  nameRequired: 'Please enter a name.',
  progressError: 'Progress must be between zero and the target.',
  deleteTask: 'Delete this task?',
  deleteHabit: 'Delete this habit?',
  deleteGoal: 'Delete this goal?',
  deleteHint: 'This item and its progress will be removed.',
  personal: 'Personal',
  study: 'Study',
  work: 'Work',
  health: 'Health',
  allTasks: 'All tasks',
  onlyToday: 'Back to today',
  all: 'All',
  upcoming: 'Upcoming',
  finished: 'Completed',
  search: 'Search tasks',
  sort: 'Sort tasks',
  sortDate: 'Date',
  sortPriority: 'Priority',
  sortCategory: 'Category',
  noMatches: 'No tasks match this view.',
  scheduled: 'Not scheduled today',
  weekHint: 'Select a day to mark it complete.',
  saveError: 'Changes could not be saved. Check that browser storage is available.',
} as const;
type Messages = { [Key in keyof typeof en]: string };
const ru: Messages = {
  today: 'Сегодня',
  habits: 'Привычки',
  goals: 'Цели',
  add: 'Добавить',
  task: 'Задача',
  habit: 'Привычка',
  goal: 'Цель',
  language: 'Язык',
  morning: 'Доброе утро',
  afternoon: 'Добрый день',
  evening: 'Добрый вечер',
  progress: 'Прогресс за сегодня',
  completed: 'выполнено',
  of: 'из',
  addTask: 'Добавить задачу',
  taskPlaceholder: 'Что нужно сделать?',
  cancel: 'Отмена',
  save: 'Сохранить',
  edit: 'Изменить',
  delete: 'Удалить',
  close: 'Закрыть',
  complete: 'Выполнить',
  uncomplete: 'Отметить невыполненным',
  viewHabits: 'Все привычки',
  noTasks: 'На сегодня пока нет задач.',
  noTasksHint: 'Добавьте задачу, когда будете готовы.',
  noHabits: 'Пока нет привычек',
  noHabitsHint: 'Начните с одной небольшой привычки.',
  noGoals: 'Пока нет целей',
  noGoalsHint: 'Выберите то, к чему хочется стремиться.',
  habitsSubtitle: 'Немного постоянства, день за днём.',
  goalsSubtitle: 'Больше внимания тому, что для вас важно.',
  newHabit: 'Добавить привычку',
  newGoal: 'Добавить цель',
  currentStreak: 'Текущая серия',
  previousWeek: 'Предыдущая неделя',
  nextWeek: 'Следующая неделя',
  thisWeek: 'Эта неделя',
  title: 'Название',
  habitName: 'Название привычки',
  category: 'Категория',
  frequency: 'Повторять',
  daily: 'Каждый день',
  weekdays: 'По будням',
  details: 'Дополнительно',
  description: 'Заметки',
  priority: 'Приоритет',
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  dueDate: 'Дата',
  time: 'Время (необязательно)',
  deadline: 'Срок (необязательно)',
  current: 'Текущий прогресс',
  target: 'Цель',
  unit: 'Единица измерения',
  steps: 'шагов',
  newTask: 'Добавить задачу',
  editTask: 'Изменить задачу',
  editHabit: 'Изменить привычку',
  editGoal: 'Изменить цель',
  nameRequired: 'Введите название.',
  progressError: 'Прогресс должен быть от нуля до целевого значения.',
  deleteTask: 'Удалить задачу?',
  deleteHabit: 'Удалить привычку?',
  deleteGoal: 'Удалить цель?',
  deleteHint: 'Элемент и его прогресс будут удалены.',
  personal: 'Личное',
  study: 'Учёба',
  work: 'Работа',
  health: 'Здоровье',
  allTasks: 'Все задачи',
  onlyToday: 'К сегодняшним',
  all: 'Все',
  upcoming: 'Предстоящие',
  finished: 'Выполненные',
  search: 'Поиск задач',
  sort: 'Сортировка задач',
  sortDate: 'По дате',
  sortPriority: 'По приоритету',
  sortCategory: 'По категории',
  noMatches: 'В этом списке пока нет задач.',
  scheduled: 'Сегодня не запланировано',
  weekHint: 'Нажмите на день, чтобы отметить выполнение.',
  saveError: 'Не удалось сохранить изменения. Проверьте доступ к хранилищу браузера.',
};
const Context = createContext<{ language: Language; setLanguage: (value: Language) => void }>({
  language: 'en',
  setLanguage: () => {},
});
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      return saved === 'en' || saved === 'ru'
        ? saved
        : navigator.language.startsWith('ru')
          ? 'ru'
          : 'en';
    } catch {
      return 'en';
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* Language remains usable without browser storage. */
    }
  }, [language]);
  return <Context.Provider value={{ language, setLanguage }}>{children}</Context.Provider>;
}
export function useLanguage() {
  const { language, setLanguage } = useContext(Context);
  const t = language === 'ru' ? ru : en;
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const date = (
    key: string,
    options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  ) => new Date(`${key}T12:00:00`).toLocaleDateString(locale, options);
  const category = (value: Category) =>
    t[({ Personal: 'personal', Study: 'study', Work: 'work', Health: 'health' } as const)[value]];
  const days = (count: number) => {
    if (language === 'en') return `${count} ${count === 1 ? 'day' : 'days'}`;
    const plural = new Intl.PluralRules('ru').select(count);
    return `${count} ${plural === 'one' ? 'день' : plural === 'few' ? 'дня' : 'дней'}`;
  };
  return { language, setLanguage, t, locale, date, category, days };
}
