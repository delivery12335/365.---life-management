import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { AppData } from '../types';
import { categories } from '../types';
import { activities, isScheduled } from '../utils/statistics';
import { prettyDate, shiftDay } from '../utils/dates';
const tooltip = {
  background: '#1b1b1e',
  border: '1px solid #323237',
  borderRadius: 8,
  color: '#f5f5f5',
  fontSize: 12,
};
export function WeeklyChart({ data, today }: { data: AppData; today: string }) {
  const points = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return {
      day: prettyDate(day, { weekday: 'short' }),
      count: activities(data, day),
      today: day === today,
    };
  });
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Weekly activity: ${points.map((p) => `${p.day} ${p.count}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 12, right: 4, left: -30, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#262629" strokeDasharray="3 4" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#909096', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: '#909096', fontSize: 11 }}
          />
          <Tooltip cursor={{ fill: '#ffffff04' }} contentStyle={tooltip} />
          <Bar
            isAnimationActive={false}
            dataKey="count"
            name="Activities"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          >
            {points.map((p, i) => (
              <Cell key={i} fill={p.today ? '#957cff' : '#594797'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CompletionChart({ data, today }: { data: AppData; today: string }) {
  const points = Array.from({ length: 14 }, (_, i) => {
    const day = shiftDay(today, i - 13);
    const eligible = data.habits.filter((h) => isScheduled(h, day));
    return {
      day: prettyDate(day),
      rate: eligible.length
        ? Math.round(
            (eligible.filter((h) => h.history.includes(day)).length / eligible.length) * 100,
          )
        : 0,
    };
  });
  return (
    <div
      className="chart"
      role="img"
      aria-label="Habit completion percentage over the last 14 days"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 12, right: 15, left: -15, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#262629" strokeDasharray="3 4" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#909096', fontSize: 10 }}
            minTickGap={30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#909096', fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltip} />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="rate"
            name="Completion %"
            stroke="#957cff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CategoryChart({ data }: { data: AppData }) {
  const colors = ['#9b8acb', '#7c5cff', '#677c9a', '#6e9b82'];
  const points = categories.map((name) => ({
    name,
    value:
      data.habits.filter((h) => h.category === name).reduce((sum, h) => sum + h.history.length, 0) +
      data.tasks.filter((t) => t.category === name && t.completed).length,
  }));
  return (
    <div className="category-chart">
      <div
        role="img"
        aria-label="Completed activities by category"
        style={{ width: 170, height: 170 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={points}
              dataKey="value"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={5}
              stroke="none"
            >
              {points.map((p, i) => (
                <Cell key={p.name} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="category-legend">
        {points.map((p, i) => (
          <div key={p.name}>
            <i style={{ background: colors[i] }} />
            <span>{p.name}</span>
            <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
