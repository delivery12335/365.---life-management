import { EmptyState } from '../components/EmptyState';
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, Repeat2 } from 'lucide-react';
import type { PageProps } from '../types/page';
import { shiftDay, weekDays } from '../utils/dates';
import { isScheduled, streaks } from '../utils/statistics';
import { useLanguage } from '../i18n';
import { ItemMenu } from '../components/TrackerUI';
export default function Habits({ data, today, toggleHabit, edit, remove }: PageProps) {
  const { t, date, days: dayCount, language } = useLanguage();
  const [offset, setOffset] = useState(0);
  const week = weekDays(shiftDay(today, offset * 7));
  if (!data.habits.length)
    return (
      <section className="life-card">
        <EmptyState
          title={t.noHabits}
          description={t.noHabitsHint}
          action={t.newHabit}
          icon={Repeat2}
          onAction={() => edit({ kind: 'habit' })}
        />
      </section>
    );
  return (
    <>
      <div className="page-section-actions">
        <button className="button secondary" onClick={() => edit({ kind: 'habit' })}>
          <Plus size={17} />
          {t.newHabit}
        </button>
        <div className="week-picker">
          <button
            className="icon-button"
            aria-label={t.previousWeek}
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>{offset === 0 ? t.thisWeek : `${date(week[0])} – ${date(week[6])}`}</span>
          <button
            className="icon-button"
            aria-label={t.nextWeek}
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="habit-cards">
        {data.habits.map((habit) => (
          <article className="simple-habit-card" key={habit.id}>
            <div className="card-title-row">
              <Repeat2 className="habit-card-icon" size={18} />
              <h2>{habit.name}</h2>
              <ItemMenu
                title={habit.name}
                edit={() => edit({ kind: 'habit', item: habit })}
                remove={() => remove('habits', habit.id)}
              />
            </div>
            <p className="streak-description">
              {t.currentStreak}: <span>{dayCount(streaks(habit, today).current)}</span>
            </p>
            <div className="simple-week">
              {week.map((day, index) => {
                const completed = habit.history.includes(day);
                return (
                  <div className={day === today ? 'current-day' : ''} key={day}>
                    <span className="week-day-label">
                      {
                        (language === 'ru'
                          ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
                          : ['M', 'T', 'W', 'T', 'F', 'S', 'S'])[index]
                      }
                    </span>
                    <button
                      className={`day-check ${completed ? 'is-checked' : ''}`}
                      onClick={() => toggleHabit(habit.id, day)}
                      disabled={day > today || !isScheduled(habit, day)}
                      aria-label={`${habit.name}, ${date(day, { weekday: 'long', month: 'long', day: 'numeric' })}`}
                      aria-pressed={completed}
                    >
                      <span>{completed ? <Check size={17} /> : <i />}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      {!data.habits.length && (
        <div className="simple-empty">
          <h2>{t.noHabits}</h2>
          <p>{t.noHabitsHint}</p>
        </div>
      )}
      {!!data.habits.length && <p className="page-helper">{t.weekHint}</p>}
    </>
  );
}
