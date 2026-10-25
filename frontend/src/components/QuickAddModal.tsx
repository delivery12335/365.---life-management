import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n';
import { categories } from '../types';
import type { AppData, Category, Editor, Goal, Habit, Task } from '../types';
import { dateKey } from '../utils/dates';
export function QuickAddModal({
  editor,
  close,
  save,
}: {
  editor: Editor;
  close: () => void;
  save: (update: (data: AppData) => AppData) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const kind = editor.kind === 'choose' ? 'task' : editor.kind;
  const { t, category } = useLanguage();
  const item = editor.kind === 'choose' ? undefined : editor.item;
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement;
    const el = dialog.current!;
    el.showModal();
    el.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
    return () => {
      el.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const task = editor.kind === 'task' ? editor.item : undefined;
  const habit = editor.kind === 'habit' ? editor.item : undefined;
  const goal = editor.kind === 'goal' ? editor.item : undefined;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const get = (key: string) => String(f.get(key) ?? '').trim();
    const title = get('title');
    if (!title) {
      setError(t.nameRequired);
      return;
    }
    const category = get('category') as Category;
    const id = item?.id ?? crypto.randomUUID();
    if (kind === 'task') {
      const next: Task = {
        id,
        title,
        description: get('description'),
        category,
        priority: get('priority') as Task['priority'],
        dueDate: get('date'),
        time: get('time'),
        completed: task?.completed ?? false,
        completedAt: task?.completedAt,
      };
      save((data) => ({
        ...data,
        tasks: item ? data.tasks.map((t) => (t.id === id ? next : t)) : [...data.tasks, next],
      }));
    }
    if (kind === 'habit') {
      const frequency = get('frequency') as Habit['frequency'];
      const next: Habit = {
        id,
        name: title,
        category,
        frequency,
        createdAt: habit?.createdAt ?? dateKey(),
        history: habit?.history ?? [],
      };
      save((data) => ({
        ...data,
        habits: item ? data.habits.map((h) => (h.id === id ? next : h)) : [...data.habits, next],
      }));
    }
    if (kind === 'goal') {
      const current = Number(get('current')),
        target = Number(get('target'));
      if (
        !Number.isFinite(current) ||
        !Number.isFinite(target) ||
        target <= 0 ||
        current < 0 ||
        current > target
      ) {
        setError(t.progressError);
        return;
      }
      const next: Goal = {
        id,
        title,
        description: get('description'),
        category,
        current,
        target,
        deadline: get('date'),
        unit: get('unit') || 'steps',
      };
      save((data) => ({
        ...data,
        goals: item ? data.goals.map((g) => (g.id === id ? next : g)) : [...data.goals, next],
      }));
    }
    close();
  }
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={close}
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-inner">
        <div className="modal-title-row">
          <h2 id="modal-title">
            {kind === 'task'
              ? item
                ? t.editTask
                : t.newTask
              : kind === 'habit'
                ? item
                  ? t.editHabit
                  : t.newHabit
                : item
                  ? t.editGoal
                  : t.newGoal}
          </h2>
          <button aria-label={t.close} className="icon-button" onClick={close}>
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit} className="editor-form">
          <label>
            {kind === 'habit' ? t.habitName : t.title}
            <input
              name="title"
              autoFocus
              defaultValue={task?.title ?? habit?.name ?? goal?.title}
              required
              maxLength={120}
            />
          </label>
          {kind === 'habit' && (
            <label>
              {t.frequency}
              <select name="frequency" defaultValue={habit?.frequency ?? 'Daily'}>
                <option value="Daily">{t.daily}</option>
                <option value="Weekdays">{t.weekdays}</option>
              </select>
            </label>
          )}
          {kind === 'goal' && (
            <>
              <div className="form-grid">
                <label>
                  {t.current}
                  <input
                    name="current"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={goal?.current ?? 0}
                    required
                  />
                </label>
                <label>
                  {t.target}
                  <input
                    name="target"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={goal?.target ?? 20}
                    required
                  />
                </label>
              </div>
              <label>
                {t.deadline}
                <input name="date" type="date" defaultValue={goal?.deadline ?? ''} />
              </label>
            </>
          )}
          {kind === 'task' && (
            <div className="form-grid">
              <label>
                {t.dueDate}
                <input name="date" type="date" defaultValue={task?.dueDate ?? dateKey()} required />
              </label>
              <label>
                {t.time}
                <input name="time" type="time" defaultValue={task?.time} />
              </label>
            </div>
          )}
          <details className="form-details">
            <summary>{t.details}</summary>
            <div className="advanced-fields">
              <label>
                {t.category}
                <select name="category" defaultValue={item?.category ?? 'Personal'}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {category(c)}
                    </option>
                  ))}
                </select>
              </label>
              {kind !== 'habit' && (
                <label>
                  {t.description}
                  <textarea
                    name="description"
                    defaultValue={task?.description ?? goal?.description}
                    rows={2}
                    maxLength={1000}
                  />
                </label>
              )}
              {kind === 'task' && (
                <label>
                  {t.priority}
                  <select name="priority" defaultValue={task?.priority ?? 'Medium'}>
                    <option value="Low">{t.low}</option>
                    <option value="Medium">{t.medium}</option>
                    <option value="High">{t.high}</option>
                  </select>
                </label>
              )}
              {kind === 'goal' && (
                <label>
                  {t.unit}
                  <input name="unit" defaultValue={goal?.unit ?? t.steps} maxLength={30} />
                </label>
              )}
            </div>
          </details>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={close}>
              {t.cancel}
            </button>
            <button type="submit" className="button primary">
              {item ? t.save : t.add}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
