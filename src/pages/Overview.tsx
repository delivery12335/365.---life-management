import { ArrowRight, CheckCheck, Flame, Target, TrendingUp, Plus, Sun } from 'lucide-react';
import type { AppData, Editor, Page } from '../types';
import { dailyProgress, streaks, activities } from '../utils/statistics';
import { weekDays, shiftDay } from '../utils/dates';
import { StatCard, SectionHead, TaskItem, HabitGrid, GoalCard, Empty } from '../components/UI';
import { WeeklyChart } from '../components/Charts';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
export interface PageProps {
  data: AppData;
  today: string;
  edit: (editor: Editor) => void;
  update: (fn: (data: AppData) => AppData) => void;
  toggleTask: (id: string) => void;
  toggleHabit: (id: string, day: string) => void;
  remove: (kind: 'tasks' | 'habits' | 'goals', id: string) => void;
  navigate: (page: Page) => void;
}
export function Stats({ data, today }: Pick<PageProps, 'data' | 'today'>) {
  const best = Math.max(0, ...data.habits.map((h) => streaks(h, today).current));
  const completed =
    data.tasks.filter((t) => t.completed).length +
    data.habits.reduce((sum, h) => sum + h.history.length, 0);
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(today, -i));
  const week = days.reduce((sum, d) => sum + dailyProgress(data, d).done, 0);
  const total = days.reduce((sum, d) => sum + dailyProgress(data, d).total, 0);
  return (
    <div className="stats-grid">
      <StatCard
        label="Activities completed"
        value={completed}
        detail={`${activities(data, today)} completed today`}
        icon={<CheckCheck size={17} />}
      />
      <StatCard
        label="Current best streak"
        value={`${best} days`}
        detail={best ? 'Keep the momentum going' : 'Every streak starts with one'}
        icon={<Flame size={17} />}
      />
      <StatCard
        label="Weekly completion"
        value={`${total ? Math.round((week / total) * 100) : 0}%`}
        detail={`${week} of ${total} scheduled activities`}
        icon={<TrendingUp size={17} />}
      />
      <StatCard
        label="Active goals"
        value={data.goals.filter((g) => g.current < g.target).length}
        detail={`${data.goals.filter((g) => g.current >= g.target).length} goals achieved so far`}
        icon={<Target size={17} />}
      />
    </div>
  );
}
export default function Overview(props: PageProps) {
  const { data, today, edit, navigate, toggleTask, toggleHabit, remove } = props;
  const progress = dailyProgress(data, today);
  const tasks = data.tasks.filter((t) => t.dueDate === today);
  const remaining = progress.total - progress.done;
  return (
    <>
      <Stats data={data} today={today} />
      <div className="overview-top">
        <section className="panel progress-panel">
          <div className="progress-copy">
            <span className="eyebrow">
              <Sun size={14} /> YOUR DAILY CHECK-IN
            </span>
            <h2>
              A little better,
              <br />
              every day.
            </h2>
            <p>
              {remaining
                ? `${remaining} more small steps to a great day.`
                : progress.total
                  ? 'You showed up. Take a moment to enjoy it.'
                  : 'A fresh day, full of possibilities.'}
            </p>
            <div className="progress-caption">
              <span className="status-dot" />
              {progress.done} of {progress.total} activities completed
            </div>
          </div>
          <div className="progress-ring">
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle cx="80" cy="80" r="67" />
              <circle
                className="ring-fill"
                cx="80"
                cy="80"
                r="67"
                strokeDasharray={`${progress.percent * 4.21} 421`}
              />
            </svg>
            <div>
              <strong>
                {progress.percent}
                <span>%</span>
              </strong>
              <small>Today's progress</small>
            </div>
          </div>
        </section>
        <section className="panel weekly-panel">
          <SectionHead
            title="Weekly activity"
            detail="Your last 7 days"
            action="Analytics"
            onAction={() => navigate('Analytics')}
          />
          <WeeklyChart data={data} today={today} />
        </section>
      </div>
      <div className="overview-middle">
        <section className="panel today-panel">
          <SectionHead
            title="Today's tasks"
            detail={`${tasks.filter((t) => t.completed).length}/${tasks.length} completed`}
            action="View all"
            onAction={() => navigate('Tasks')}
          />
          {tasks.length ? (
            tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                compact
                onToggle={() => toggleTask(t.id)}
                onEdit={() => edit({ kind: 'task', item: t })}
                onDelete={() => remove('tasks', t.id)}
              />
            ))
          ) : (
            <Empty
              title="No tasks for today"
              text="A clear mind starts with a clear plan."
              onCreate={() => edit({ kind: 'task' })}
            />
          )}
          <button className="add-inline" onClick={() => edit({ kind: 'task' })}>
            <Plus size={15} />
            Add a task<span>Make it happen</span>
          </button>
        </section>
        <section className="panel habits-panel">
          <SectionHead
            title="Habit tracker"
            detail="Show up for yourself"
            action="Manage"
            onAction={() => navigate('Habits')}
          />
          {data.habits.length ? (
            <HabitGrid
              habits={data.habits.slice(0, 4)}
              days={weekDays(today)}
              today={today}
              toggle={toggleHabit}
              edit={(h) => edit({ kind: 'habit', item: h })}
              remove={(id) => remove('habits', id)}
            />
          ) : (
            <Empty
              title="No habits yet"
              text="Start with one small habit and build consistency."
              onCreate={() => edit({ kind: 'habit' })}
            />
          )}
        </section>
      </div>
      <section className="goals-section">
        <SectionHead
          title="Goals in motion"
          detail="The bigger picture"
          action="View all goals"
          onAction={() => navigate('Goals')}
        />
        <div className="goals-grid">
          {data.goals.slice(0, 3).map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              compact
              edit={() => edit({ kind: 'goal', item: g })}
              remove={() => remove('goals', g.id)}
            />
          ))}
          {!data.goals.length && (
            <Empty
              title="No goals yet"
              text="Give your next chapter a direction."
              onCreate={() => edit({ kind: 'goal' })}
            />
          )}
        </div>
      </section>
      <section className="panel activity-panel">
        <SectionHead
          title="Your consistency, at a glance"
          action="Explore activity"
          onAction={() => navigate('Analytics')}
        />
        <ActivityHeatmap data={data} today={today} />
      </section>
      <div className="dashboard-footer">
        <span>
          <span className="status-dot" />
          Your progress is saved on this device
        </span>
        <span>
          Made for your everyday <ArrowRight size={12} />
        </span>
      </div>
    </>
  );
}
