import { Plus } from 'lucide-react';
import type { PageProps } from './Overview';
import { useLanguage } from '../i18n';
import { SimpleGoal } from '../components/TrackerUI';
export default function Goals({ data, edit, remove }: PageProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="page-section-actions">
        <button className="button secondary" onClick={() => edit({ kind: 'goal' })}>
          <Plus size={17} />
          {t.newGoal}
        </button>
      </div>
      <div className="simple-goal-list">
        {data.goals.map((goal) => (
          <SimpleGoal
            key={goal.id}
            goal={goal}
            edit={() => edit({ kind: 'goal', item: goal })}
            remove={() => remove('goals', goal.id)}
          />
        ))}
      </div>
      {!data.goals.length && (
        <div className="simple-empty">
          <h2>{t.noGoals}</h2>
          <p>{t.noGoalsHint}</p>
        </div>
      )}
    </>
  );
}
