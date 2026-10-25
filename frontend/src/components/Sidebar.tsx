import {
  Sun,
  CalendarDays,
  ListTodo,
  Repeat2,
  Heart,
  Wallet,
  NotebookPen,
  Settings,
  Ellipsis,
} from 'lucide-react';
import type { Page } from '../types';
import { useLifeLanguage } from '../lifeI18n';
const nav = [
  { page: 'Overview', href: 'Today', key: 'today', icon: Sun },
  { page: 'Calendar', href: 'Calendar', key: 'calendar', icon: CalendarDays },
  { page: 'Tasks', href: 'Tasks', key: 'tasks', icon: ListTodo },
  { page: 'Habits', href: 'Habits', key: 'habits', icon: Repeat2 },
  { page: 'Health', href: 'Health', key: 'health', icon: Heart },
  { page: 'Finance', href: 'Finance', key: 'finance', icon: Wallet },
  { page: 'Notes', href: 'Notes', key: 'notes', icon: NotebookPen },
] as const;
export function Sidebar({ page }: { page: Page }) {
  const { l, t } = useLifeLanguage();
  return (
    <aside className="sidebar">
      <a className="brand" href="#Today" aria-label="365.">
        365<span>.</span>
      </a>
      <nav aria-label="365.">
        {nav.map(({ page: destination, href, key, icon: Icon }) => (
          <a
            key={href}
            href={`#${href}`}
            className={`nav-link ${page === destination ? 'active' : ''} nav-${href.toLowerCase()}`}
            aria-current={page === destination ? 'page' : undefined}
          >
            <Icon size={19} />
            <span>{key === 'habits' ? t.habits : l[key]}</span>
          </a>
        ))}
      </nav>
      <a
        className={`nav-link settings-link ${page === 'Settings' ? 'active' : ''}`}
        href="#Settings"
      >
        <Settings size={19} />
        <span>{l.settings}</span>
      </a>
    </aside>
  );
}
export function MobileNav({ page }: { page: Page }) {
  const { l, t } = useLifeLanguage();
  return (
    <nav className="mobile-nav" aria-label="365.">
      {[nav[0], nav[2], nav[1], nav[3]].map(({ page: destination, href, key, icon: Icon }) => (
        <a
          key={href}
          href={`#${href}`}
          className={page === destination ? 'active' : ''}
          aria-current={page === destination ? 'page' : undefined}
        >
          <Icon size={20} />
          <span>{key === 'habits' ? t.habits : l[key]}</span>
        </a>
      ))}
      <details className="mobile-more">
        <summary
          className={
            ['Health', 'Finance', 'Notes', 'Settings', 'Goals'].includes(page) ? 'active' : ''
          }
        >
          <Ellipsis size={21} />
          <span>{l.more}</span>
        </summary>
        <div className="mobile-more-menu">
          {nav.slice(4).map(({ href, key, icon: Icon }) => (
            <a
              key={href}
              href={`#${href}`}
              aria-label={key === 'habits' ? t.habits : l[key]}
              onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
            >
              <Icon size={19} />
              {l[key as 'health' | 'finance' | 'notes']}
            </a>
          ))}
          <a
            href="#Settings"
            onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
          >
            <Settings size={19} />
            {l.settings}
          </a>
        </div>
      </details>
    </nav>
  );
}
