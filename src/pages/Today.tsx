import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCheck, Footprints, Plus, Repeat2 } from 'lucide-react';
import {
  CardTitle,
  FinancePreview,
  HealthPreview,
  HabitCheck,
  Schedule,
  type LifePageProps,
} from '../components/LifeUI';
import { ProgressRing } from '../components/ProgressRing';
import { SimpleTask } from '../components/TrackerUI';
import { dailyProgress, isScheduled, streaks } from '../utils/statistics';
import { wellnessFor } from '../utils/life';
import { useLifeLanguage } from '../lifeI18n';
export default function Today({
  data,
  today,
  edit,
  update,
  toggleTask,
  toggleHabit,
  remove,
  navigate,
  openLife,
  openNote,
  inlineRequest = 0,
}: LifePageProps & { inlineRequest?: number }) {
  const { t, l, number, days, locale } = useLifeLanguage();
  const progress = dailyProgress(data, today);
  const tasks = data.tasks.filter((t) => t.dueDate === today);
  const habits = data.habits.filter((h) => isScheduled(h, today));
  const wellness = wellnessFor(data, today);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inlineRequest) setAdding(true);
  }, [inlineRequest]);
  useEffect(() => {
    if (adding) input.current?.focus();
  }, [adding, inlineRequest]);
  function create(e: React.FormEvent) {
    e.preventDefault();
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
      <section className="life-card daily-summary">
        <div className="daily-ring-composition">
          <ProgressRing value={progress.percent} size={172} stroke={12} label={t.progress}>
            <strong className="daily-percent">
              {progress.percent}
              <small>%</small>
            </strong>
            <span>{l.yourDay}</span>
          </ProgressRing>
          <div className="summary-copy">
            <span className="summary-eyebrow">{l.yourDay}</span>
            <h2>
              {progress.total ? (
                <>
                  {progress.done} {t.of} {progress.total} {t.completed}
                </>
              ) : (
                t.noTasksHint
              )}
            </h2>
            <p>{t.progress}</p>
          </div>
        </div>
        <div className="daily-indicators">
          <div>
            <span className="indicator-icon blue">
              <CheckCheck size={18} />
            </span>
            <span>
              {l.tasks}
              <strong>
                {tasks.filter((t) => t.completed).length}
                <small> / {tasks.length}</small>
              </strong>
            </span>
          </div>
          <div>
            <span className="indicator-icon purple">
              <Repeat2 size={18} />
            </span>
            <span>
              {t.habits}
              <strong>
                {habits.filter((h) => h.history.includes(today)).length}
                <small> / {habits.length}</small>
              </strong>
            </span>
          </div>
          <div>
            <span className="indicator-icon green">
              <Footprints size={18} />
            </span>
            <span>
              {l.activity}
              <strong>
                {wellness ? number(wellness.steps) : '—'}
                {wellness && <small> {l.steps}</small>}
              </strong>
            </span>
          </div>
        </div>
      </section>
      <div className="today-primary-grid">
        <section className="life-card daily-tasks">
          <CardTitle title={t.today} action={t.allTasks} onAction={() => navigate('Tasks')} />
          {tasks.map((task) => (
            <SimpleTask
              key={task.id}
              task={task}
              toggle={() => toggleTask(task.id)}
              edit={() => edit({ kind: 'task', item: task })}
              remove={() => remove('tasks', task.id)}
            />
          ))}
          {!tasks.length && <p className="list-empty">{l.noTasksYet}</p>}
          {adding ? (
            <form className="inline-task-form" onSubmit={create}>
              <input
                ref={input}
                aria-label={t.title}
                placeholder={t.taskPlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setAdding(false);
                }}
              />
              <div className="inline-form-actions">
                <button type="button" className="button secondary" onClick={() => setAdding(false)}>
                  {t.cancel}
                </button>
                <button className="button primary" disabled={!title.trim()}>
                  {t.addTask}
                </button>
              </div>
            </form>
          ) : (
            <button className="add-task-inline" onClick={() => setAdding(true)}>
              <Plus size={17} />
              {t.addTask}
            </button>
          )}
        </section>
        <section className="life-card daily-calendar">
          <CardTitle
            title={l.schedule}
            action={l.viewCalendar}
            onAction={() => navigate('Calendar')}
          />
          <Schedule events={(data.events ?? []).filter((e) => e.date === today)} open={openLife} />
        </section>
      </div>
      <section className="life-card daily-habits">
        <CardTitle title={t.habits} action={l.allHabits} onAction={() => navigate('Habits')} />
        <div className="habit-preview-grid">
          {habits.map((habit) => (
            <div className="habit-preview-item" key={habit.id}>
              <HabitCheck
                done={habit.history.includes(today)}
                toggle={() => toggleHabit(habit.id, today)}
                label={`${habit.history.includes(today) ? t.uncomplete : t.complete}: ${habit.name}`}
              />
              <div>
                <strong>{habit.name}</strong>
                <span>{days(streaks(habit, today).current)}</span>
              </div>
            </div>
          ))}
          {!habits.length && (
            <p className="muted small-text">{data.habits.length ? t.scheduled : t.noHabits}</p>
          )}
          {!habits.length && (
            <button className="quiet-button" onClick={() => edit({ kind: 'habit' })}>
              {t.newHabit}
            </button>
          )}
        </div>
      </section>
      <div className="today-secondary-grid">
        <HealthPreview data={data} today={today} navigate={navigate} openLife={openLife} />
        <FinancePreview data={data} today={today} navigate={navigate} openLife={openLife} />
      </div>
      <section className="notes-preview-section">
        <CardTitle title={l.recentNotes} action={l.newNote} onAction={() => openNote()} />
        <div className="note-preview-grid">
          {[...(data.notes ?? [])]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 3)
            .map((note) => (
              <button
                className="life-card note-preview"
                key={note.id}
                onClick={() => openNote(note.id)}
              >
                <span className="note-preview-corner">
                  <ArrowUpRight size={16} />
                </span>
                <h3>{note.title || l.untitled}</h3>
                <p>{note.content.slice(0, 100) || l.noteEmpty}</p>
                <small>
                  {new Date(note.updatedAt).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </small>
              </button>
            ))}
          {!data.notes?.length && <p className="muted">{l.noNotes}</p>}
          {!data.notes?.length && (
            <button className="button secondary" onClick={() => openNote()}>
              <Plus size={16} />
              {l.newNote}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
