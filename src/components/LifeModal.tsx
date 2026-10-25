import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { AppData, Category } from '../types';
import { categories } from '../types';
import type {
  LifeEditor,
  Transaction,
  CalendarEvent,
  HealthEntry,
  ExpenseCategory,
} from '../types/life';
import { expenseCategories } from '../types/life';
import { dateKey } from '../utils/dates';
import { useLifeLanguage } from '../lifeI18n';
import { SelectField } from './SelectField';
export function LifeModal({
  editor,
  close,
  update,
}: {
  editor: LifeEditor;
  close: () => void;
  update: (fn: (data: AppData) => AppData) => void;
}) {
  const { t, l, category } = useLifeLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const event = editor.kind === 'event' ? editor.item : undefined;
  const health = editor.kind === 'health' ? editor.item : undefined;
  const transaction = editor.kind === 'transaction' ? editor.item : undefined;
  const [kind, setKind] = useState(transaction?.type ?? 'expense');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(
    transaction?.category && transaction.category !== 'Income' ? transaction.category : 'Other',
  );
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current!;
    el.showModal();
    el.querySelector<HTMLInputElement>('input')?.focus();
    return () => {
      el.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? '').trim();
    const num = (key: string) => Number(get(key));
    const date = get('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
      setError(l.dateError);
      return;
    }
    const id = editor.item?.id ?? crypto.randomUUID();
    if (editor.kind === 'event') {
      if (!get('title')) {
        setError(t.nameRequired);
        return;
      }
      if (get('end') <= get('start')) {
        setError(l.invalidTime);
        return;
      }
      const next: CalendarEvent = {
        id,
        title: get('title'),
        date,
        start: get('start'),
        end: get('end'),
        category: get('category') as Category,
        description: get('description'),
      };
      update((d) => ({
        ...d,
        events: event
          ? (d.events ?? []).map((v) => (v.id === id ? next : v))
          : [...(d.events ?? []), next],
      }));
    }
    if (editor.kind === 'transaction') {
      if (!get('title')) {
        setError(t.nameRequired);
        return;
      }
      if (!Number.isFinite(num('amount')) || num('amount') <= 0) {
        setError(l.invalidAmount);
        return;
      }
      const next: Transaction = {
        id,
        title: get('title'),
        date,
        amount: Math.round(num('amount') * 100) / 100,
        type: kind,
        category: kind === 'income' ? 'Income' : (get('category') as ExpenseCategory),
      };
      update((d) => ({
        ...d,
        transactions: transaction
          ? (d.transactions ?? []).map((v) => (v.id === id ? next : v))
          : [...(d.transactions ?? []), next],
      }));
    }
    if (editor.kind === 'health') {
      const keys = ['steps', 'stepGoal', 'water', 'waterGoal', 'sleep', 'exercise'];
      if (
        keys.some((k) => !Number.isFinite(num(k)) || num(k) < 0) ||
        num('stepGoal') <= 0 ||
        num('waterGoal') <= 0 ||
        num('sleep') > 24 ||
        num('exercise') > 1440 ||
        date > dateKey()
      ) {
        setError(l.invalidHealth);
        return;
      }
      const next: HealthEntry = {
        id,
        date,
        steps: num('steps'),
        stepGoal: num('stepGoal'),
        water: num('water'),
        waterGoal: num('waterGoal'),
        sleep: num('sleep'),
        exercise: num('exercise'),
      };
      update((d) => ({
        ...d,
        health: [...(d.health ?? []).filter((v) => v.date !== date && v.id !== id), next],
      }));
    }
    close();
  }
  return (
    <dialog ref={ref} className="modal" aria-labelledby="life-modal-title" onCancel={close}>
      <div className="modal-inner">
        <div className="modal-title-row">
          <h2 id="life-modal-title">
            {editor.kind === 'event'
              ? l.event
              : editor.kind === 'health'
                ? l.healthEntry
                : l.transaction}
          </h2>
          <button className="icon-button" aria-label={t.close} onClick={close}>
            <X size={19} />
          </button>
        </div>
        <form className="editor-form" onSubmit={save}>
          {editor.kind !== 'health' && (
            <label>
              {t.title}
              <input
                name="title"
                defaultValue={event?.title ?? transaction?.title}
                maxLength={120}
                required
              />
            </label>
          )}
          <label>
            {t.dueDate}
            <input
              name="date"
              type="date"
              defaultValue={
                event?.date ??
                health?.date ??
                transaction?.date ??
                (editor.kind !== 'transaction' ? editor.date : undefined) ??
                dateKey()
              }
              max={editor.kind === 'health' ? dateKey() : undefined}
              readOnly={!!health}
              required
            />
          </label>
          {editor.kind === 'event' && (
            <>
              <div className="form-grid">
                <label>
                  {l.start}
                  <input name="start" type="time" defaultValue={event?.start ?? '10:00'} required />
                </label>
                <label>
                  {l.end}
                  <input name="end" type="time" defaultValue={event?.end ?? '11:00'} required />
                </label>
              </div>
              <label>
                {t.category}
                <SelectField
                  name="category"
                  label={t.category}
                  defaultValue={event?.category ?? 'Personal'}
                  options={categories.map((c) => ({ value: c, label: category(c) }))}
                />
              </label>
              <label>
                {t.description}
                <textarea
                  name="description"
                  defaultValue={event?.description}
                  maxLength={2000}
                  rows={2}
                />
              </label>
            </>
          )}
          {editor.kind === 'transaction' && (
            <>
              <div className="form-grid">
                <label>
                  {l.type}
                  <SelectField
                    label={l.type}
                    value={kind}
                    onChange={(value) => setKind(value as 'income' | 'expense')}
                    options={[
                      { value: 'expense', label: l.expense },
                      { value: 'income', label: l.income },
                    ]}
                  />
                </label>
                <label>
                  {l.amount} (USD)
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max="999999999"
                    defaultValue={transaction?.amount}
                    required
                  />
                </label>
              </div>
              <label>
                {t.category}
                <SelectField
                  name="category"
                  label={t.category}
                  value={kind === 'income' ? 'Income' : expenseCategory}
                  onChange={(value) => setExpenseCategory(value as ExpenseCategory)}
                  disabled={kind === 'income'}
                  options={(kind === 'income'
                    ? ['Income' as const]
                    : expenseCategories.filter((c) => c !== 'Income')
                  ).map((c) => ({ value: c, label: l[c] }))}
                />
              </label>
            </>
          )}
          {editor.kind === 'health' && (
            <>
              <div className="form-grid">
                <label>
                  {l.stepsToday}
                  <input
                    name="steps"
                    type="number"
                    min="0"
                    step="1"
                    max="1000000"
                    defaultValue={health?.steps ?? 0}
                    required
                  />
                </label>
                <label>
                  {l.stepGoal}
                  <input
                    name="stepGoal"
                    type="number"
                    min="1"
                    step="1"
                    max="1000000"
                    defaultValue={health?.stepGoal ?? ''}
                    required
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  {l.waterLitres}
                  <input
                    name="water"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={health?.water ?? 0}
                    required
                  />
                </label>
                <label>
                  {l.waterGoal}
                  <input
                    name="waterGoal"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    defaultValue={health?.waterGoal ?? ''}
                    required
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  {l.sleepHours}
                  <input
                    name="sleep"
                    type="number"
                    min="0"
                    max="24"
                    step="0.01"
                    defaultValue={health?.sleep ?? 0}
                    required
                  />
                </label>
                <label>
                  {l.exerciseMinutes}
                  <input
                    name="exercise"
                    type="number"
                    min="0"
                    max="1440"
                    step="1"
                    defaultValue={health?.exercise ?? 0}
                    required
                  />
                </label>
              </div>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={close}>
              {t.cancel}
            </button>
            <button className="button primary">{t.save}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
