import type { AppData } from '../types';
import { activities } from '../utils/statistics';
import { parseDate, prettyDate, shiftDay } from '../utils/dates';
export function ActivityHeatmap({ data, today }: { data: AppData; today: string }) {
  const startDate = parseDate(today);
  startDate.setMonth(startDate.getMonth() - 3);
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const days: string[] = [];
  for (let day = start; day <= today; day = shiftDay(day, 1)) days.push(day);
  const total = days.reduce((sum, d) => sum + activities(data, d), 0);
  return (
    <div className="heatmap-wrap">
      <div className="heatmap-top">
        <span>
          <strong>{total}</strong> activities in the last 3 months
        </span>
        <span className="muted">Consistency, one day at a time</span>
      </div>
      <div className="heatmap-months">
        {[0, 1, 2, 3].map((i) => {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          return <span key={i}>{date.toLocaleDateString('en-US', { month: 'short' })}</span>;
        })}
      </div>
      <div className="heatmap-content">
        <div className="heatmap-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div
          className="heatmap"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil((days.length + ((parseDate(start).getDay() + 6) % 7)) / 7)}, 1fr)`,
          }}
        >
          {Array.from({ length: (parseDate(start).getDay() + 6) % 7 }, (_, i) => (
            <span key={`blank${i}`} />
          ))}
          {days.map((day) => {
            const count = activities(data, day);
            return (
              <div
                tabIndex={0}
                key={day}
                className={`heat-cell intensity-${Math.min(4, count)}`}
                aria-label={`${prettyDate(day)}, ${count} completed activities`}
              >
                <span className="heat-tooltip">
                  {prettyDate(day)} · {count} activities
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="heatmap-bottom">
        <span>A little progress, every day.</span>
        <div>
          Less
          {[0, 1, 2, 3, 4].map((n) => (
            <i key={n} className={`intensity-${n}`} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
