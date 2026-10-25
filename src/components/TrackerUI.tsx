import { Check, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Goal, Task } from '../types';
import { useLanguage } from '../i18n';
export function ItemMenu({
  title,
  edit,
  remove,
}: {
  title: string;
  edit: () => void;
  remove: () => void;
}) {
  const { t } = useLanguage();
  return (
    <details className="item-menu">
      <summary aria-label={`${t.edit}: ${title}`}>
        <MoreHorizontal size={19} />
      </summary>
      <div className="item-menu-popover">
        <button
          onClick={(e) => {
            e.currentTarget.closest('details')?.removeAttribute('open');
            edit();
          }}
        >
          <Pencil size={15} />
          {t.edit}
        </button>
        <button
          className="delete-option"
          onClick={(e) => {
            e.currentTarget.closest('details')?.removeAttribute('open');
            remove();
          }}
        >
          <Trash2 size={15} />
          {t.delete}
        </button>
      </div>
    </details>
  );
}
export function SimpleTask({
  task,
  toggle,
  edit,
  remove,
  showDate = false,
}: {
  task: Task;
  toggle: () => void;
  edit: () => void;
  remove: () => void;
  showDate?: boolean;
}) {
  const { t, category, date } = useLanguage();
  return (
    <div className={`simple-task ${task.completed ? 'is-complete' : ''}`}>
      <button
        className="check-control"
        aria-label={`${task.completed ? t.uncomplete : t.complete}: ${task.title}`}
        aria-pressed={task.completed}
        onClick={toggle}
      >
        <span>{task.completed && <Check size={14} />}</span>
      </button>
      <button className="task-name" onClick={edit}>
        {task.title}
      </button>
      <span className="task-category">{category(task.category)}</span>
      {(task.time || showDate) && (
        <span className="task-when">{showDate ? date(task.dueDate) : task.time}</span>
      )}
      <ItemMenu title={task.title} edit={edit} remove={remove} />
    </div>
  );
}
export function SimpleGoal({
  goal,
  edit,
  remove,
}: {
  goal: Goal;
  edit: () => void;
  remove: () => void;
}) {
  const { date } = useLanguage();
  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return (
    <article className="simple-goal">
      <div className="card-title-row">
        <button className="goal-name" onClick={edit}>
          {goal.title}
        </button>
        <ItemMenu title={goal.title} edit={edit} remove={remove} />
      </div>
      <div className="goal-meter-row">
        <div
          className="simple-progress"
          role="progressbar"
          aria-label={goal.title}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className="goal-percent">{percent}%</span>
      </div>
      {goal.deadline && (
        <p className="goal-deadline">
          {date(goal.deadline, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
    </article>
  );
}
