import { EmptyState } from '../components/EmptyState';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { PageProps } from './Overview';
import { filterTasks } from '../utils/statistics';
import { SimpleTask } from '../components/TrackerUI';
import { useLifeLanguage } from '../lifeI18n';
export default function LifeTasks({ data, today, edit, toggleTask, remove }: PageProps) {
  const { t, l } = useLifeLanguage();
  const [filter, setFilter] = useState('Today');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const tasks = filterTasks(data.tasks, filter, query, sort, today);
  if (!data.tasks.length)
    return (
      <section className="life-card">
        <EmptyState
          title={l.noTasksYet}
          action={t.addTask}
          icon={Plus}
          onAction={() => edit({ kind: 'task' })}
        />
      </section>
    );
  return (
    <section className="life-card task-manager">
      <div className="task-manager-toolbar">
        <div className="segmented">
          {[
            { key: 'Today', label: t.today },
            { key: 'Upcoming', label: t.upcoming },
            { key: 'All', label: t.all },
            { key: 'Completed', label: t.finished },
          ].map((item) => (
            <button
              className={filter === item.key ? 'selected' : ''}
              key={item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button className="button primary" onClick={() => edit({ kind: 'task' })}>
          <Plus size={16} />
          {t.addTask}
        </button>
      </div>
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
        <select aria-label={t.sort} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">{t.sortDate}</option>
          <option value="priority">{t.sortPriority}</option>
          <option value="category">{t.sortCategory}</option>
        </select>
      </div>
      {tasks.map((task) => (
        <SimpleTask
          key={task.id}
          task={task}
          showDate={filter !== 'Today'}
          toggle={() => toggleTask(task.id)}
          edit={() => edit({ kind: 'task', item: task })}
          remove={() => remove('tasks', task.id)}
        />
      ))}
      {!tasks.length && <p className="list-empty">{t.noMatches}</p>}
    </section>
  );
}
