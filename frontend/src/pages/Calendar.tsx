import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { LifePageProps } from '../components/LifeUI';
import { CardTitle, Schedule } from '../components/LifeUI';
import { dateKey, parseDate, shiftDay, weekDays } from '../utils/dates';
import { useLifeLanguage } from '../lifeI18n';
export default function Calendar({
  data,
  today,
  openLife,
  update,
  confirmDelete,
}: { confirmDelete: (fn: () => void) => void } & LifePageProps) {
  const { l, t, date, language } = useLifeLanguage();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const events = data.events ?? [];
  const first = selected.slice(0, 7) + '-01';
  const start = weekDays(first)[0];
  const monthDays = Array.from({ length: 42 }, (_, i) => shiftDay(start, i));
  const dates = view === 'month' ? monthDays : view === 'week' ? weekDays(selected) : [selected];
  function move(amount: number) {
    if (view === 'month') {
      const d = parseDate(first);
      d.setMonth(d.getMonth() + amount);
      setSelected(dateKey(d));
    } else setSelected(shiftDay(selected, amount * (view === 'week' ? 7 : 1)));
  }
  const daily = events
    .filter((e) => e.date === selected)
    .sort((a, b) => a.start.localeCompare(b.start));
  return (
    <>
      <div className="calendar-toolbar">
        <div className="calendar-month-heading">
          <button className="icon-button" aria-label={l.previous} onClick={() => move(-1)}>
            <ChevronLeft size={18} />
          </button>
          <h2>{date(selected, { month: 'long', year: 'numeric' })}</h2>
          <button className="icon-button" aria-label={l.next} onClick={() => move(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="segmented">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button key={v} className={view === v ? 'selected' : ''} onClick={() => setView(v)}>
              {l[v]}
            </button>
          ))}
        </div>
        <button className="button secondary" onClick={() => setSelected(today)}>
          {l.today}
        </button>
      </div>
      <section className={`life-card calendar-card view-${view}`}>
        {view === 'month' ? (
          <>
            <div className="calendar-weekdays">
              {(language === 'ru'
                ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              ).map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="month-grid">
              {dates.map((day) => {
                const items = events.filter((e) => e.date === day);
                return (
                  <button
                    className={`month-day ${day.slice(0, 7) !== selected.slice(0, 7) ? 'outside-month' : ''} ${day === selected ? 'selected-day' : ''} ${day === today ? 'is-today' : ''}`}
                    key={day}
                    aria-label={`${date(day, { weekday: 'long', month: 'long', day: 'numeric' })}, ${items.length} ${l.event}`}
                    aria-pressed={day === selected}
                    onClick={() => setSelected(day)}
                  >
                    <span className="day-number">{parseDate(day).getDate()}</span>
                    <span className="calendar-day-events">
                      {items.slice(0, 2).map((e) => (
                        <span
                          className={`calendar-event-tag event-${e.category.toLowerCase()}`}
                          key={e.id}
                        >
                          {e.title}
                        </span>
                      ))}
                      {items.length > 2 && <small>+{items.length - 2}</small>}
                    </span>
                    <span className="calendar-dots">
                      {items.slice(0, 3).map((e) => (
                        <i key={e.id} className={`event-${e.category.toLowerCase()}`} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className={`calendar-agenda agenda-${view}`}>
            {dates.map((day) => (
              <section key={day}>
                <h3>
                  <button
                    onClick={() => setSelected(day)}
                    className={day === today ? 'is-today' : ''}
                  >
                    {date(day, { weekday: 'short', day: 'numeric' })}
                  </button>
                </h3>
                {events
                  .filter((e) => e.date === day)
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .map((event) => (
                    <button
                      key={event.id}
                      className={`agenda-event event-${event.category.toLowerCase()}`}
                      onClick={() => openLife({ kind: 'event', item: event })}
                    >
                      <small>
                        {event.start} – {event.end}
                      </small>
                      <strong>{event.title}</strong>
                    </button>
                  ))}
                <button
                  className="agenda-add"
                  aria-label={`${l.addEvent}, ${date(day)}`}
                  onClick={() => openLife({ kind: 'event', date: day })}
                >
                  <Plus size={16} />
                </button>
              </section>
            ))}
          </div>
        )}
      </section>
      <section className="life-card selected-schedule">
        <CardTitle
          title={`${l.scheduleFor} ${date(selected, { day: 'numeric', month: 'long' })}`}
          action={l.addEvent}
          onAction={() => openLife({ kind: 'event', date: selected })}
        />
        <Schedule
          events={daily}
          open={(e) => openLife(e.kind === 'event' && !e.item ? { ...e, date: selected } : e)}
        />
        {daily.map((event) => (
          <div className="record-actions" key={event.id}>
            <span>{event.title}</span>
            <button onClick={() => openLife({ kind: 'event', item: event })}>{t.edit}</button>
            <button
              onClick={() =>
                confirmDelete(() =>
                  update((d) => ({ ...d, events: d.events?.filter((e) => e.id !== event.id) })),
                )
              }
            >
              {t.delete}
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
