import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Plus, Search } from 'lucide-react';
import type { PageProps } from './Overview';
import { dailyProgress, filterTasks, isScheduled } from '../utils/statistics';
import { useLanguage } from '../i18n';
import { SimpleTask } from '../components/TrackerUI';
export default function Today({
  data,
  today,
  update,
  toggleTask,
  toggleHabit,
  edit,
  remove,
  navigate,
  inlineRequest = 0,
}: PageProps & { inlineRequest?: number }) {
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inlineRequest) {
      setAdding(true);
      setShowAll(false);
    }
  }, [inlineRequest]);
  useEffect(() => {
    if (adding) input.current?.focus();
  }, [adding, inlineRequest]);
  const progress = dailyProgress(data, today);
  const tasks = showAll
    ? filterTasks(data.tasks, filter, query, sort, today)
    : data.tasks.filter((task) => task.dueDate === today);
  const habits = data.habits.filter((habit) => isScheduled(habit, today));
  function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    update((d) => ({
      ...d,
      tasks: [
        ...d.tasks,
        {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: '',
          category: 'Personal',
          priority: 'Medium',
          dueDate: today,
          time: '',
          completed: false,
        },
      ],
    }));
    setTitle('');
    input.current?.focus();
  }
  return (
    <>
      <section className="today-progress" aria-labelledby="progress-title">
        <div>
          <h2 id="progress-title">{t.progress}</h2>
          <span>
            {progress.done} {t.of} {progress.total} {t.completed}
          </span>
        </div>
        <div
          className="simple-progress"
          role="progressbar"
          aria-labelledby="progress-title"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      </section>
      <section className="today-tasks" aria-labelledby="tasks-title">
        <div className="simple-section-title">
          <h2 id="tasks-title">{showAll ? t.allTasks : t.today}</h2>
          <button className="quiet-button" onClick={() => setShowAll((value) => !value)}>
            {showAll ? t.onlyToday : t.allTasks}
          </button>
        </div>
        {showAll && (
          <div className="task-tools">
            <label className="task-search">
              <Search size={16} />
              <input
                aria-label={t.search}
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label={t.allTasks}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">{t.all}</option>
              <option value="Today">{t.today}</option>
              <option value="Upcoming">{t.upcoming}</option>
              <option value="Completed">{t.finished}</option>
            </select>
            <select aria-label={t.sort} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date">{t.sortDate}</option>
              <option value="priority">{t.sortPriority}</option>
              <option value="category">{t.sortCategory}</option>
            </select>
          </div>
        )}
        <div className="simple-task-list">
          {tasks.map((task) => (
            <SimpleTask
              key={task.id}
              task={task}
              showDate={showAll}
              toggle={() => toggleTask(task.id)}
              edit={() => edit({ kind: 'task', item: task })}
              remove={() => remove('tasks', task.id)}
            />
          ))}
          {!tasks.length && (
            <div className="list-empty">
              <p>{showAll ? t.noMatches : t.noTasks}</p>
              {!showAll && <span>{t.noTasksHint}</span>}
            </div>
          )}
        </div>
        {adding ? (
          <form className="inline-task-form" onSubmit={addTask}>
            <div className="inline-input-row">
              <span className="empty-circle" />
              <input
                ref={input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.taskPlaceholder}
                aria-label={t.title}
                maxLength={120}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setAdding(false);
                    setTitle('');
                  }
                }}
              />
            </div>
            <div className="inline-form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setAdding(false);
                  setTitle('');
                }}
              >
                {t.cancel}
              </button>
              <button className="button primary" type="submit" disabled={!title.trim()}>
                {t.addTask}
              </button>
            </div>
          </form>
        ) : (
          <button className="add-task-inline" onClick={() => setAdding(true)}>
            <Plus size={18} />
            {t.addTask}
          </button>
        )}
      </section>
      <section className="today-habits" aria-labelledby="habits-title">
        <div className="simple-section-title">
          <h2 id="habits-title">{t.habits}</h2>
        </div>
        {habits.map((habit) => {
          const completed = habit.history.includes(today);
          return (
            <div className={`today-habit ${completed ? 'is-complete' : ''}`} key={habit.id}>
              <span>{habit.name}</span>
              <button
                className="check-control habit-control"
                onClick={() => toggleHabit(habit.id, today)}
                aria-label={`${completed ? t.uncomplete : t.complete}: ${habit.name}`}
                aria-pressed={completed}
              >
                <span>{completed && <Check size={15} />}</span>
              </button>
            </div>
          );
        })}
        {!habits.length && (
          <div className="list-empty">
            <p>{data.habits.length ? t.scheduled : t.noHabits}</p>
            {!data.habits.length && <span>{t.noHabitsHint}</span>}
          </div>
        )}
        <button className="view-habits" onClick={() => navigate('Habits')}>
          {t.viewHabits}
          <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
