import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Sun,
  Moon,
  ListTodo,
  CalendarDays,
  Repeat2,
  Wallet,
  NotebookPen,
  Heart,
  UserRound,
} from 'lucide-react';
import { Sidebar, MobileNav } from './components/Sidebar';
import { LanguageDropdown } from './components/LanguageDropdown';
import { QuickAddModal } from './components/QuickAddModal';
import { LifeModal } from './components/LifeModal';
import { useUserData } from './hooks/useUserData';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AuthPage, AuthLoading } from './auth/AuthPage';
import { useAuthMessages } from './auth/messages';
import { useTheme } from './hooks/useTheme';
import { dateKey } from './utils/dates';
import { isScheduled } from './utils/statistics';
import { LanguageProvider } from './i18n';
import { useLifeLanguage } from './lifeI18n';
import type { Editor, Page } from './types';
import type { LifeEditor, Note } from './types/life';
import Today from './pages/Today';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Health from './pages/Health';
import Finance from './pages/Finance';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
const pages: Page[] = [
  'Calendar',
  'Tasks',
  'Habits',
  'Health',
  'Finance',
  'Notes',
  'Settings',
  'Goals',
];
const getPage = (): Page => {
  try {
    const hash = decodeURIComponent(location.hash.slice(1));
    return pages.includes(hash as Page) ? (hash as Page) : 'Overview';
  } catch {
    return 'Overview';
  }
};
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LanguageProvider>
  );
}
function AuthGate() {
  const auth = useAuth();
  const [resetting, setResetting] = useState(() => location.hash.startsWith('#reset-password'));
  useEffect(() => {
    const sync = () => setResetting(location.hash.startsWith('#reset-password'));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  if (auth.loading || (auth.error && !auth.user))
    return (
      <AuthLoading
        error={auth.error}
        retry={() => {
          void auth.refresh();
        }}
      />
    );
  if (!auth.user || resetting) return <AuthPage />;
  return <Tracker key={auth.user.id} />;
}
function Tracker() {
  const auth = useAuth();
  const authText = useAuthMessages();
  const { data, setData, error, loading, saving, loaded, flush } = useUserData(auth.user!.id);
  const { t, l, date } = useLifeLanguage();
  const { theme, setTheme, toggle } = useTheme();
  const [page, setPage] = useState<Page>(getPage);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [lifeEditor, setLifeEditor] = useState<LifeEditor | null>(null);
  const [today, setToday] = useState(dateKey());
  const [inlineRequest, setInlineRequest] = useState(0);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; action: () => void } | null>(
    null,
  );
  const addMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const handler = () => {
      setPage(getPage());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    const interval = window.setInterval(() => setToday(dateKey()), 30000);
    return () => {
      window.removeEventListener('hashchange', handler);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    const click = (event: PointerEvent) => {
      document
        .querySelectorAll<HTMLDetailsElement>('.item-menu[open],.add-menu[open],.mobile-more[open]')
        .forEach((menu) => {
          if (event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
        });
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape')
        document
          .querySelectorAll<HTMLDetailsElement>(
            '.item-menu[open],.add-menu[open],.mobile-more[open]',
          )
          .forEach((menu) => {
            menu.open = false;
            menu.querySelector<HTMLElement>('summary')?.focus();
          });
    };
    document.addEventListener('pointerdown', click);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', click);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  const navigate = (next: Page) => {
    location.hash = next === 'Overview' ? 'Today' : next;
    setPage(next);
  };
  const toggleTask = (id: string) =>
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, completedAt: task.completed ? undefined : today }
          : task,
      ),
    }));
  const toggleHabit = (id: string, day: string) =>
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) =>
        h.id === id && day <= today && isScheduled(h, day)
          ? {
              ...h,
              history: h.history.includes(day)
                ? h.history.filter((v) => v !== day)
                : [...h.history, day],
            }
          : h,
      ),
    }));
  const remove = (kind: 'tasks' | 'habits' | 'goals', id: string) =>
    setConfirmation({
      title: kind === 'tasks' ? t.deleteTask : kind === 'habits' ? t.deleteHabit : t.deleteGoal,
      action: () => setData((d) => ({ ...d, [kind]: d[kind].filter((item) => item.id !== id) })),
    });
  const confirmDelete = (action: () => void) => setConfirmation({ title: l.deleteRecord, action });
  function openNote(id?: string) {
    if (id) setSelectedNote(id);
    else {
      const now = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        title: '',
        content: '',
        createdAt: now,
        updatedAt: now,
        pinned: false,
      };
      setData((d) => ({ ...d, notes: [...(d.notes ?? []), note] }));
      setSelectedNote(note.id);
    }
    navigate('Notes');
  }
  const props = {
    data,
    today,
    edit: setEditor,
    update: setData,
    toggleTask,
    toggleHabit,
    remove,
    navigate,
    openLife: setLifeEditor,
    openNote,
  };
  const title =
    page === 'Overview'
      ? t.today
      : page === 'Habits'
        ? t.habits
        : page === 'Goals'
          ? t.goals
          : page === 'Calendar'
            ? l.calendar
            : page === 'Tasks'
              ? l.tasks
              : page === 'Health'
                ? l.health
                : page === 'Finance'
                  ? l.finance
                  : page === 'Notes'
                    ? l.notes
                    : l.settings;
  const descriptions: Partial<Record<Page, string>> = {
    Calendar: l.calendarIntro,
    Tasks: l.tasksIntro,
    Habits: t.habitsSubtitle,
    Health: l.wellness,
    Finance: l.financeIntro,
    Notes: l.notesIntro,
    Settings: l.settingsIntro,
    Goals: t.goalsSubtitle,
  };
  useEffect(() => {
    document.title = `365. · ${title}`;
  }, [title]);
  function add(kind: 'task' | 'habit' | 'event' | 'transaction' | 'health' | 'note') {
    addMenu.current?.removeAttribute('open');
    if (kind === 'task') {
      navigate('Overview');
      setInlineRequest((n) => n + 1);
    } else if (kind === 'habit') setEditor({ kind });
    else if (kind === 'note') openNote();
    else if (kind === 'health') setLifeEditor({ kind, date: today });
    else setLifeEditor({ kind });
  }
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;
  if (loading || !loaded)
    return <AuthLoading error={!!error} retry={() => window.location.reload()} />;
  async function signOut() {
    await flush();
    await auth.signOut();
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} />
      <div className="main-shell">
        <main id="main-content">
          <header className="page-header">
            <div>
              <span className="mobile-wordmark">365.</span>
              <h1>
                {page === 'Overview' ? (data.name ? `${greeting}, ${data.name}` : greeting) : title}
              </h1>
              <p className={page === 'Overview' ? 'full-date' : ''}>
                {page === 'Overview'
                  ? date(today, { weekday: 'long', month: 'long', day: 'numeric' })
                  : descriptions[page]}
              </p>
            </div>
            <div className="header-controls">
              <span className="account-save-status" role="status">
                {saving ? authText.saving : error ? '' : authText.saved}
              </span>
              <LanguageDropdown />
              <button
                className="theme-toggle icon-button"
                aria-label={l.themeToggle}
                onClick={toggle}
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <button
                className="profile-avatar"
                aria-label={l.profile}
                onClick={() => navigate('Settings')}
              >
                {data.name ? data.name.slice(0, 1) : <UserRound size={17} />}
              </button>
              <details className="add-menu" ref={addMenu}>
                <summary className="button primary">
                  <Plus size={17} />
                  {t.add}
                </summary>
                <div className="add-popover">
                  {[
                    { kind: 'task', label: t.task, icon: ListTodo },
                    { kind: 'event', label: l.event, icon: CalendarDays },
                    { kind: 'habit', label: t.habit, icon: Repeat2 },
                    { kind: 'transaction', label: l.transaction, icon: Wallet },
                    { kind: 'note', label: l.note, icon: NotebookPen },
                    { kind: 'health', label: l.healthEntry, icon: Heart },
                  ].map(({ kind, label, icon: Icon }) => (
                    <button
                      key={kind}
                      onClick={() =>
                        add(kind as 'task' | 'habit' | 'event' | 'transaction' | 'health' | 'note')
                      }
                    >
                      <Icon size={17} />
                      {label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </header>
          {error && (
            <p role="alert" className="storage-error">
              {error in authText ? authText[error as keyof typeof authText] : authText.save_error}
              <button
                className="button secondary"
                onClick={() => {
                  if (error === 'data_conflict') window.location.reload();
                  else void flush().catch(() => {});
                }}
              >
                {error === 'data_conflict' ? authText.reload : authText.retry}
              </button>
            </p>
          )}
          <div className={`page-content page-${page.toLowerCase()}`} key={page}>
            {page === 'Overview' && <Today {...props} inlineRequest={inlineRequest} />}
            {page === 'Calendar' && <Calendar {...props} confirmDelete={confirmDelete} />}
            {page === 'Tasks' && <Tasks {...props} />}
            {page === 'Habits' && <Habits {...props} />}
            {page === 'Health' && <Health {...props} confirmDelete={confirmDelete} />}
            {page === 'Finance' && <Finance {...props} confirmDelete={confirmDelete} />}
            {page === 'Notes' && (
              <Notes
                {...props}
                selectedId={selectedNote}
                setSelectedId={setSelectedNote}
                confirmDelete={confirmDelete}
              />
            )}
            {page === 'Settings' && (
              <Settings
                {...props}
                theme={theme}
                setTheme={setTheme}
                email={auth.user!.email}
                onSignOut={signOut}
              />
            )}
            {page === 'Goals' && <Goals {...props} />}
          </div>
        </main>
      </div>
      <MobileNav page={page} />
      {editor && <QuickAddModal editor={editor} close={() => setEditor(null)} save={setData} />}
      {lifeEditor && (
        <LifeModal editor={lifeEditor} close={() => setLifeEditor(null)} update={setData} />
      )}
      {confirmation && (
        <Confirm
          title={confirmation.title}
          close={() => setConfirmation(null)}
          confirm={() => {
            confirmation.action();
            setConfirmation(null);
          }}
        />
      )}
    </div>
  );
}
function Confirm({
  title,
  close,
  confirm,
}: {
  title: string;
  close: () => void;
  confirm: () => void;
}) {
  const { t, l } = useLifeLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const previous = document.activeElement;
    el.showModal();
    return () => {
      el.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal confirm-modal"
      onCancel={close}
      aria-labelledby="confirm-title"
    >
      <div className="modal-inner">
        <h2 id="confirm-title">{title}</h2>
        <p className="muted">{l.deleteHint}</p>
        <div className="modal-footer">
          <button autoFocus className="button secondary" onClick={close}>
            {t.cancel}
          </button>
          <button className="button danger" onClick={confirm}>
            {t.delete}
          </button>
        </div>
      </div>
    </dialog>
  );
}
