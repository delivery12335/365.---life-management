import { EmptyState } from './EmptyState';
import { ArrowUpRight, Check, Droplets, Footprints, Moon, Timer } from 'lucide-react';
import type { PageProps } from '../types/page';
import type { LifeEditor, CalendarEvent } from '../types/life';
import { useLifeLanguage } from '../lifeI18n';
import { financeSummary, percent, wellnessFor } from '../utils/life';
import { ProgressRing } from './ProgressRing';
import { expenseCategories } from '../types/life';
export type LifePageProps = PageProps & {
  openLife: (editor: LifeEditor) => void;
  openNote: (id?: string) => void;
};
export function CardTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card-heading">
      <h2>{title}</h2>
      {action && (
        <button className="subtle-link" onClick={onAction}>
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
export function Schedule({
  events,
  open,
}: {
  events: CalendarEvent[];
  open: (editor: LifeEditor) => void;
}) {
  const { l, t, category } = useLifeLanguage();
  return (
    <div className="schedule-list">
      {events.length ? (
        events
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((event) => (
            <button
              className={`schedule-event event-${event.category.toLowerCase()}`}
              key={event.id}
              onClick={() => open({ kind: 'event', item: event })}
            >
              <span className="event-time">
                {event.start}
                <small>{event.end}</small>
              </span>
              <i />
              <span className="event-title">
                {event.title}
                <small>{category(event.category)}</small>
              </span>
            </button>
          ))
      ) : (
        <div className="list-empty">
          <p>{l.noEvents}</p>
          <span>{l.noEventsHint}</span>
        </div>
      )}
      <button className="quiet-button" onClick={() => open({ kind: 'event' })}>
        + {t.add} {l.event.toLowerCase()}
      </button>
    </div>
  );
}
export function HealthPreview({
  data,
  today,
  navigate,
  openLife,
}: Pick<LifePageProps, 'data' | 'today' | 'navigate' | 'openLife'>) {
  const { l, number, duration } = useLifeLanguage();
  const entry = wellnessFor(data, today);
  if (!entry)
    return (
      <section className="life-card health-preview">
        <CardTitle title={l.health} />
        <EmptyState
          title={l.noHistory}
          action={l.addEntry}
          icon={Footprints}
          onAction={() => openLife({ kind: 'health', date: today })}
        />
      </section>
    );
  return (
    <section className="life-card health-preview">
      <CardTitle title={l.health} action={l.viewHealth} onAction={() => navigate('Health')} />
      <div className="health-preview-main">
        <ProgressRing
          value={percent(entry.steps, entry.stepGoal)}
          size={134}
          color="var(--green)"
          label={l.stepsToday}
        >
          <Footprints size={24} />
        </ProgressRing>
        <div>
          <span className="metric-caption">{l.stepsToday}</span>
          <strong className="big-number">{number(entry.steps)}</strong>
          <span className="metric-caption">
            {l.goal} {number(entry.stepGoal)}
          </span>
        </div>
      </div>
      <div className="wellness-mini">
        <div>
          <Droplets size={16} />
          <span>{l.water}</span>
          <strong>
            {number(entry.water)} / {number(entry.waterGoal)} {l.litres}
          </strong>
        </div>
        <div>
          <Moon size={16} />
          <span>{l.sleep}</span>
          <strong>{duration(entry.sleep)}</strong>
        </div>
        <div>
          <Timer size={16} />
          <span>{l.exercise}</span>
          <strong>
            {entry.exercise} {l.minutes}
          </strong>
        </div>
      </div>
    </section>
  );
}
export function FinancePreview({
  data,
  today,
  navigate,
  openLife,
}: Pick<LifePageProps, 'data' | 'today' | 'navigate' | 'openLife'>) {
  const { l, money } = useLifeLanguage();
  const summary = financeSummary(data.transactions ?? [], today.slice(0, 7), data.openingBalance);
  const colors = [
    'var(--green)',
    'var(--blue)',
    'var(--purple)',
    'var(--orange)',
    'var(--pink)',
    'var(--muted)',
  ];
  const spending = expenseCategories
    .filter((c) => c !== 'Income')
    .map((category, i) => ({
      name: l[category],
      color: colors[i],
      amount: (data.transactions ?? [])
        .filter(
          (tx) =>
            tx.type === 'expense' &&
            tx.category === category &&
            tx.date.slice(0, 7) === today.slice(0, 7),
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  if (!data.transactions?.length && !data.openingBalance)
    return (
      <section className="life-card finance-preview">
        <CardTitle title={l.finance} />
        <EmptyState
          title={l.noTransactions}
          action={l.addTransaction}
          icon={Timer}
          onAction={() => openLife({ kind: 'transaction' })}
        />
      </section>
    );
  return (
    <section className="life-card finance-preview">
      <CardTitle title={l.finance} action={l.viewFinances} onAction={() => navigate('Finance')} />
      <span className="metric-caption">{l.balance}</span>
      <strong className="balance-number">{money(summary.balance)}</strong>
      <div className="finance-mini">
        <div>
          <span>{l.income}</span>
          <strong className="positive">+{money(summary.income)}</strong>
        </div>
        <div>
          <span>{l.spent}</span>
          <strong>−{money(summary.spent)}</strong>
        </div>
      </div>
      <div className="spending-mini" aria-label={l.spending}>
        {spending.map((item) => (
          <span
            key={item.name}
            title={`${item.name}: ${money(item.amount)}`}
            style={{
              width: `${summary.spent ? (item.amount / summary.spent) * 100 : 0}%`,
              background: item.color,
            }}
          />
        ))}
      </div>
      <div className="spending-mini-legend">
        {spending.slice(0, 3).map((item) => (
          <span key={item.name}>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
    </section>
  );
}
export function HabitCheck({
  done,
  toggle,
  label,
}: {
  done: boolean;
  toggle: () => void;
  label: string;
}) {
  return (
    <button
      className={`habit-circle ${done ? 'done' : ''}`}
      onClick={toggle}
      aria-label={label}
      aria-pressed={done}
    >
      {done ? <Check size={17} /> : <span />}
    </button>
  );
}
