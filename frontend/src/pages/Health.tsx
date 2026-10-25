import { EmptyState } from '../components/EmptyState';
import { Footprints, Droplets, Moon, Timer, Plus, Pencil, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import type { LifePageProps } from '../components/LifeUI';
import { CardTitle } from '../components/LifeUI';
import { ProgressRing } from '../components/ProgressRing';
import { percent, wellnessFor } from '../utils/life';
import { shiftDay } from '../utils/dates';
import { useLifeLanguage } from '../lifeI18n';
export default function Health({
  data,
  today,
  openLife,
  update,
  confirmDelete,
}: LifePageProps & { confirmDelete: (fn: () => void) => void }) {
  const { t, l, number, date, duration } = useLifeLanguage();
  const entry = wellnessFor(data, today);
  const points = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return {
      day: date(day, { weekday: 'short' }),
      steps: data.health?.find((h) => h.date === day)?.steps ?? null,
    };
  });
  const metrics = entry
    ? [
        {
          title: l.stepsToday,
          value: number(entry.steps),
          detail: `/ ${number(entry.stepGoal)}`,
          percent: percent(entry.steps, entry.stepGoal),
          color: 'var(--green)',
          icon: Footprints,
        },
        {
          title: l.water,
          value: number(entry.water),
          detail: `/ ${number(entry.waterGoal)} ${l.litres}`,
          percent: percent(entry.water, entry.waterGoal),
          color: 'var(--blue)',
          icon: Droplets,
        },
        {
          title: l.sleep,
          value: duration(entry.sleep),
          detail: l.sleepHours,
          percent: undefined,
          color: 'var(--purple)',
          icon: Moon,
        },
        {
          title: l.exercise,
          value: String(entry.exercise),
          detail: l.minutes,
          percent: undefined,
          color: 'var(--pink)',
          icon: Timer,
        },
      ]
    : [];
  if (!data.health?.length)
    return (
      <section className="life-card">
        <EmptyState
          title={l.noHistory}
          description={l.healthEmptyHint}
          action={l.addEntry}
          icon={Footprints}
          onAction={() => openLife({ kind: 'health', date: today })}
        />
      </section>
    );
  return (
    <>
      <div className="page-section-actions">
        <span className="muted small-text">{l.healthManual}</span>
        <button
          className="button primary"
          onClick={() =>
            openLife({
              kind: 'health',

              date: today,
            })
          }
        >
          <Plus size={17} />
          {l.healthEntry}
        </button>
      </div>
      {!entry && (
        <section className="life-card">
          <EmptyState
            title={l.noHistory}
            action={l.addEntry}
            icon={Footprints}
            onAction={() => openLife({ kind: 'health', date: today })}
          />
        </section>
      )}
      <div className="wellness-grid">
        {metrics.map(({ title, value, detail, percent: completion, color, icon: Icon }) => (
          <button
            className="life-card wellness-card"
            key={title}
            onClick={() =>
              openLife({
                kind: 'health',
                item: data.health?.find((h) => h.date === today),
                date: today,
              })
            }
          >
            <div className="wellness-title">
              <Icon size={19} style={{ color }} />
              <h2>{title}</h2>
            </div>
            {typeof completion === 'number' ? (
              <ProgressRing value={completion} size={155} color={color} label={title}>
                <Icon size={31} style={{ color }} />
              </ProgressRing>
            ) : (
              <div
                className="progress-ring metric-symbol"
                style={{ width: 155, height: 155, color }}
              >
                <Icon size={42} />
              </div>
            )}
            <strong>{value}</strong>
            <span>{detail}</span>
          </button>
        ))}
      </div>
      <section className="life-card health-chart">
        <CardTitle title={l.weeklyHistory} />
        <div className="life-chart" role="img" aria-label={l.weekActivity}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 12, right: 8, left: 8, bottom: 5 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                }}
                cursor={{ fill: 'var(--hover)' }}
              />
              <Bar
                name={l.stepsToday}
                dataKey="steps"
                radius={[6, 6, 0, 0]}
                maxBarSize={35}
                isAnimationActive={false}
              >
                {points.map((_, i) => (
                  <Cell key={i} fill={i === 6 ? 'var(--green)' : 'var(--green-soft)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="life-card">
        <CardTitle title={l.health} />
        <div className="health-history">
          {[...(data.health ?? [])]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((h) => (
              <div className="health-history-row" key={h.id}>
                <strong>{date(h.date)}</strong>
                <span>
                  {number(h.steps)} {l.steps}
                </span>
                <span>
                  {number(h.water)} {l.litres}
                </span>
                <span>{duration(h.sleep)}</span>
                <div>
                  <button
                    className="icon-button"
                    aria-label={`${t.edit}, ${date(h.date)}`}
                    onClick={() => openLife({ kind: 'health', item: h })}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${t.delete}, ${date(h.date)}`}
                    onClick={() =>
                      confirmDelete(() =>
                        update((d) => ({ ...d, health: d.health?.filter((e) => e.id !== h.id) })),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          {!data.health?.length && <p className="list-empty">{l.noHistory}</p>}
        </div>
      </section>
    </>
  );
}
