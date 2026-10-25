import { EmptyState } from '../components/EmptyState';
import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import type { LifePageProps } from '../components/LifeUI';
import { CardTitle } from '../components/LifeUI';
import { financeSummary } from '../utils/life';
import { useLifeLanguage } from '../lifeI18n';
import { expenseCategories } from '../types/life';
export default function Finance({
  data,
  today,
  openLife,
  update,
  confirmDelete,
}: LifePageProps & { confirmDelete: (fn: () => void) => void }) {
  const { l, t, money, date } = useLifeLanguage();
  const [month, setMonth] = useState(today.slice(0, 7));
  const tx = data.transactions ?? [];
  const summary = financeSummary(tx, month, data.openingBalance);
  const current = tx
    .filter((e) => e.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
  const colors = [
    'var(--orange)',
    'var(--purple)',
    'var(--blue)',
    'var(--pink)',
    'var(--green)',
    'var(--muted)',
  ];
  const breakdown = expenseCategories
    .filter((c) => c !== 'Income')
    .map((category, i) => ({
      name: l[category],
      value: current
        .filter((t) => t.type === 'expense' && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0),
      color: colors[i],
    }))
    .filter((c) => c.value > 0);
  const days = Array.from(
    { length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() },
    (_, i) => ({
      day: String(i + 1),
      spent: current
        .filter((t) => t.type === 'expense' && Number(t.date.slice(8)) === i + 1)
        .reduce((s, t) => s + t.amount, 0),
    }),
  );
  const tooltip = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text)',
  };
  if (!tx.length && !data.openingBalance)
    return (
      <section className="life-card">
        <EmptyState
          title={l.noTransactions}
          description={l.financeEmptyHint}
          action={l.addTransaction}
          icon={ArrowDownLeft}
          onAction={() => openLife({ kind: 'transaction' })}
        />
      </section>
    );
  return (
    <>
      <div className="page-section-actions">
        <input
          type="month"
          aria-label={l.monthLabel}
          value={month}
          onChange={(e) => {
            if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);
          }}
        />
        <button className="button primary" onClick={() => openLife({ kind: 'transaction' })}>
          <Plus size={17} />
          {l.addTransaction}
        </button>
      </div>
      <section className="life-card finance-overview">
        <div>
          <span className="metric-caption">{l.balance}</span>
          <strong className="balance-number">{money(summary.balance)}</strong>
        </div>
        <div className="finance-totals">
          <div>
            <span>{l.income}</span>
            <strong className="positive">{money(summary.income)}</strong>
          </div>
          <div>
            <span>{l.spent}</span>
            <strong>{money(summary.spent)}</strong>
          </div>
          <div>
            <span>{l.savings}</span>
            <strong>{money(summary.savings)}</strong>
          </div>
        </div>
      </section>
      <div className="finance-charts">
        <section className="life-card">
          <CardTitle title={l.spending} />
          <div className="life-chart" role="img" aria-label={l.spending}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                <XAxis
                  dataKey="day"
                  minTickGap={20}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={tooltip}
                  cursor={{ fill: 'var(--hover)' }}
                  formatter={(v) => money(Number(v))}
                />
                <Bar
                  name={l.spent}
                  dataKey="spent"
                  fill="var(--green)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="life-card">
          <CardTitle title={l.breakdown} />
          {breakdown.length ? (
            <div className="finance-breakdown">
              <div className="donut-chart" role="img" aria-label={l.breakdown}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="value"
                      innerRadius={47}
                      outerRadius={65}
                      paddingAngle={4}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {breakdown.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltip} formatter={(v) => money(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="breakdown-legend">
                {breakdown.map((c) => (
                  <div key={c.name}>
                    <i style={{ background: c.color }} />
                    <span>{c.name}</span>
                    <strong>{money(c.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="list-empty">{l.noTransactions}</p>
          )}
        </section>
      </div>
      <section className="life-card">
        <CardTitle title={l.transactions} />
        {current.map((tx) => (
          <div className="transaction-row" key={tx.id}>
            <span className={`transaction-icon ${tx.type === 'income' ? 'positive' : ''}`}>
              {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </span>
            <button
              className="transaction-name"
              onClick={() => openLife({ kind: 'transaction', item: tx })}
            >
              <strong>{tx.title}</strong>
              <small>
                {l[tx.category]} · {date(tx.date)}
              </small>
            </button>
            <strong className={tx.type === 'income' ? 'positive' : ''}>
              {tx.type === 'income' ? '+' : '−'}
              {money(tx.amount)}
            </strong>
            <div className="transaction-actions">
              <button
                className="icon-button"
                aria-label={`${t.edit}: ${tx.title}`}
                onClick={() => openLife({ kind: 'transaction', item: tx })}
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-button"
                aria-label={`${t.delete}: ${tx.title}`}
                onClick={() =>
                  confirmDelete(() =>
                    update((d) => ({
                      ...d,
                      transactions: d.transactions?.filter((v) => v.id !== tx.id),
                    })),
                  )
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!current.length && <p className="list-empty">{l.noTransactions}</p>}
      </section>
    </>
  );
}
