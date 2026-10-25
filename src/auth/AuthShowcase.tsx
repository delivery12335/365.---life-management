import {
  CalendarDays,
  Heart,
  ListTodo,
  NotebookPen,
  Repeat2,
  Sun,
  Wallet,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { useLifeLanguage } from '../lifeI18n';
import { useAuthMessages } from './messages';
export function AuthFeatures() {
  const { l, t } = useLifeLanguage();
  const a = useAuthMessages();
  const features = [
    { name: l.tasks, hint: a.featureTasks, icon: ListTodo, color: 'purple' },
    { name: l.calendar, hint: a.featureCalendar, icon: CalendarDays, color: 'orange' },
    { name: t.habits, hint: a.featureHabits, icon: Repeat2, color: 'green' },
    { name: l.health, hint: a.featureHealth, icon: Heart, color: 'pink' },
    { name: l.finance, hint: a.featureFinance, icon: Wallet, color: 'purple' },
    { name: l.notes, hint: a.featureNotes, icon: NotebookPen, color: 'blue' },
  ];
  return (
    <div className="auth-features">
      {features.map(({ name, hint, icon: Icon, color }) => (
        <div className="auth-feature" key={name}>
          <span className={`auth-feature-icon ${color}`}>
            <Icon size={24} />
          </span>
          <div>
            <strong>{name}</strong>
            <small>{hint}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
export function AuthShowcase() {
  const { t, l } = useLifeLanguage();
  const nav = [
    { label: t.today, icon: Sun },
    { label: l.calendar, icon: CalendarDays },
    { label: l.tasks, icon: ListTodo },
    { label: t.habits, icon: Repeat2 },
    { label: l.health, icon: Heart },
    { label: l.finance, icon: Wallet },
    { label: l.notes, icon: NotebookPen },
  ];
  return (
    <div className="auth-showcase" aria-hidden="true">
      <div className="showcase-device">
        <aside>
          <strong>
            365<span>.</span>
          </strong>
          {nav.map(({ label, icon: Icon }, i) => (
            <span className={i === 0 ? 'selected' : ''} key={label}>
              <Icon size={13} />
              {label}
            </span>
          ))}
        </aside>
        <div className="showcase-content">
          <div className="showcase-header">
            <strong>{t.today}</strong>
            <span>
              <Sun size={14} />
              <i />
              <span className="showcase-add">
                <Plus size={11} />
                {t.add}
              </span>
            </span>
          </div>
          <div className="showcase-summary">
            <div className="showcase-ring">
              <Sun size={23} />
            </div>
            <div>
              <span>{l.yourDay}</span>
              <i />
              <i />
            </div>
          </div>
          <div className="showcase-columns">
            <div>
              <strong>{t.today}</strong>
              {[0, 1, 2].map((i) => (
                <div className="showcase-line" key={i}>
                  <b />
                  <i />
                </div>
              ))}
            </div>
            <div>
              <strong>{l.schedule}</strong>
              {[0, 1, 2].map((i) => (
                <div className={`showcase-event line-${i}`} key={i}>
                  <b />
                  <span>
                    <i />
                    <i />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="showcase-float showcase-float-health">
        <Heart size={24} />
        <div>
          <strong>{l.health}</strong>
          <span>{l.healthManual}</span>
        </div>
        <div className="showcase-bars">
          {[12, 20, 30, 22, 37].map((h, i) => (
            <i key={i} style={{ height: h }} />
          ))}
        </div>
      </div>
      <div className="showcase-float showcase-float-habits">
        <Repeat2 size={28} />
        <div>
          <strong>{t.habits}</strong>
          <span>{t.habitsSubtitle}</span>
        </div>
        <ArrowUpRight size={17} />
      </div>
    </div>
  );
}
