import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Plus,
  Check,
  Pencil,
  Trash2,
  Clock3,
  Target,
  BookOpen,
  Dumbbell,
  Briefcase,
  Droplets,
  Flame,
  Leaf,
} from 'lucide-react';
import type { Category, Goal, Habit, Task } from '../types';
import { prettyDate } from '../utils/dates';
import { habitRate, isScheduled, streaks } from '../utils/statistics';
export const categoryIcons = { Personal: Leaf, Study: BookOpen, Work: Briefcase, Health: Dumbbell };
export function Badge({ category }: { category: Category }) {
  return (
    <span className={`badge category-${category.toLowerCase()}`}>
      <i />
      {category}
    </span>
  );
}
export function SectionHead({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {detail && <span className="section-detail">{detail}</span>}
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  text,
  onCreate,
}: {
  title: string;
  text: string;
  onCreate: () => void;
}) {
  return (
    <div className="empty">
      <Target size={25} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="button secondary" onClick={onCreate}>
        <Plus size={15} />
        Create {title.includes('habit') ? 'habit' : title.includes('goal') ? 'goal' : 'task'}
      </button>
    </div>
  );
}
export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        {label}
        <span>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  compact = false,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`task-row ${task.completed ? 'completed' : ''}`}>
      <button
        className="checkbox"
        aria-label={`${task.completed ? 'Uncomplete' : 'Complete'} ${task.title}`}
        aria-pressed={task.completed}
        onClick={onToggle}
      >
        {task.completed && <Check size={13} />}
      </button>
      <div className="task-title">
        <strong>{task.title}</strong>
        {!compact && task.description && <p>{task.description}</p>}
        <div className="task-mobile-meta">
          <Badge category={task.category} />
        </div>
      </div>
      <div className="task-meta">
        <Badge category={task.category} />
        {!compact && (
          <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
        )}
        <span className="task-time">
          {task.time ? (
            <>
              <Clock3 size={12} />
              {task.time}
            </>
          ) : (
            prettyDate(task.dueDate)
          )}
        </span>
      </div>
      <div className="row-actions">
        <button aria-label={`Edit ${task.title}`} onClick={onEdit}>
          <Pencil size={14} />
        </button>
        <button aria-label={`Delete ${task.title}`} onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
export function HabitGrid({
  habits,
  days,
  today,
  toggle,
  edit,
  remove,
  expanded = false,
}: {
  habits: Habit[];
  days: string[];
  today: string;
  toggle: (id: string, day: string) => void;
  edit: (habit: Habit) => void;
  remove: (id: string) => void;
  expanded?: boolean;
}) {
  return (
    <div className="habit-grid">
      <div className="habit-grid-head">
        <span>HABIT</span>
        <div className="week-cells">
          {days.map((d) => (
            <span className={d === today ? 'today-label' : ''} key={d}>
              {prettyDate(d, { weekday: 'short' }).slice(0, 1)}
              <small>{prettyDate(d, { day: 'numeric' })}</small>
            </span>
          ))}
        </div>
        <span className="streak-heading">STREAK</span>
      </div>
      {habits.map((h) => {
        const Icon = h.name.toLowerCase().includes('water') ? Droplets : categoryIcons[h.category];
        const stats = streaks(h, today);
        return (
          <div className="habit-wrapper" key={h.id}>
            <div className="habit-row">
              <div className="habit-name">
                <span className={`habit-icon category-${h.category.toLowerCase()}`}>
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{h.name}</strong>
                  <small>{h.frequency}</small>
                </div>
              </div>
              <div className="week-cells">
                {days.map((d) => (
                  <button
                    key={d}
                    disabled={d > today || !isScheduled(h, d)}
                    className={`habit-check ${h.history.includes(d) ? 'checked' : ''} ${d === today ? 'is-today' : ''}`}
                    aria-label={`${h.name}, ${prettyDate(d)}, ${h.history.includes(d) ? 'completed' : 'not completed'}`}
                    aria-pressed={h.history.includes(d)}
                    onClick={() => toggle(h.id, d)}
                  >
                    {h.history.includes(d) ? <Check size={14} /> : <span />}
                  </button>
                ))}
              </div>
              <span className="streak">
                <Flame size={15} />
                {stats.current}
                <small>days</small>
              </span>
            </div>
            {expanded && (
              <div className="habit-extra">
                <Badge category={h.category} />
                <span>
                  Best: <b>{stats.longest} days</b>
                </span>
                <span>
                  7-day completion: <b>{habitRate(h, today)}%</b>
                </span>
                <div className="row-actions">
                  <button onClick={() => edit(h)} aria-label={`Edit ${h.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(h.id)} aria-label={`Delete ${h.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
export function GoalCard({
  goal,
  edit,
  remove,
  compact = false,
}: {
  goal: Goal;
  edit: () => void;
  remove: () => void;
  compact?: boolean;
}) {
  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const Icon = categoryIcons[goal.category];
  return (
    <article className={`goal-card ${compact ? 'compact' : ''}`}>
      <div className="goal-top">
        <span className={`habit-icon category-${goal.category.toLowerCase()}`}>
          <Icon size={18} />
        </span>
        <Badge category={goal.category} />
        <div className="row-actions">
          <button onClick={edit} aria-label={`Edit ${goal.title}`}>
            <Pencil size={14} />
          </button>
          <button onClick={remove} aria-label={`Delete ${goal.title}`}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <button className="goal-title" onClick={edit}>
        {goal.title}
      </button>
      {!compact && <p>{goal.description}</p>}
      <div className="goal-progress-label">
        <span>
          {goal.current}{' '}
          <span>
            / {goal.target} {goal.unit}
          </span>
        </span>
        <strong>{percent}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={goal.title}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="goal-footer">
        <span>
          <Clock3 size={12} /> {prettyDate(goal.deadline)}
        </span>
        <button className="text-button" onClick={edit}>
          Update progress
          <ArrowUpRight size={13} />
        </button>
      </div>
    </article>
  );
}
