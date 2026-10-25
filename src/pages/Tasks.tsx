import { useState } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import type { PageProps } from './Overview';
import { TaskItem, Empty } from '../components/UI';
import { filterTasks } from '../utils/statistics';
export default function Tasks({ data, today, edit, toggleTask, remove }: PageProps) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const tasks = filterTasks(data.tasks, filter, query, sort, today);
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">A CLEAR MIND STARTS HERE</span>
          <h2>One thing at a time.</h2>
          <p>Turn your intentions into action.</p>
        </div>
        <button className="button primary" onClick={() => edit({ kind: 'task' })}>
          <Plus size={16} />
          New task
        </button>
      </div>
      <section className="panel task-manager">
        <div className="task-toolbar">
          <div className="tabs">
            {['All', 'Today', 'Upcoming', 'Completed'].map((f) => (
              <button
                key={f}
                className={filter === f ? 'selected' : ''}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="task-controls">
            <label className="search">
              <Search size={15} />
              <input
                aria-label="Search tasks"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
              />
            </label>
            <label className="sort">
              <SlidersHorizontal size={15} />
              <select
                aria-label="Sort tasks"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="date">Due date</option>
                <option value="priority">Priority</option>
                <option value="category">Category</option>
              </select>
            </label>
          </div>
        </div>
        <div className="list-heading">
          <span>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
          <span>Organize your day, your way</span>
        </div>
        {tasks.length ? (
          tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={() => toggleTask(t.id)}
              onEdit={() => edit({ kind: 'task', item: t })}
              onDelete={() => remove('tasks', t.id)}
            />
          ))
        ) : (
          <Empty
            title="No tasks found"
            text="Try another filter, or start with one small task."
            onCreate={() => edit({ kind: 'task' })}
          />
        )}
      </section>
    </>
  );
}
