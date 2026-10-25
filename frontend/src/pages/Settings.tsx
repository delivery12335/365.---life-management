import { useAuthMessages } from '../auth/messages';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { useState } from 'react';
import { Download } from 'lucide-react';
import type { LifePageProps } from '../components/LifeUI';
import { useLifeLanguage } from '../lifeI18n';
export default function Settings({
  data,
  update,
  navigate,
  theme,
  setTheme,
  email,
  onSignOut,
}: LifePageProps & {
  theme: 'dark' | 'light';
  setTheme: (v: 'dark' | 'light') => void;
  email: string;
  onSignOut: () => Promise<void>;
}) {
  const { t, l } = useLifeLanguage();
  const authText = useAuthMessages();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const [name, setName] = useState(data.name);
  const [saved, setSaved] = useState(false);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = '365-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="settings-stack">
      <section className="life-card">
        <h2>{authText.account}</h2>
        <p className="account-email">{email}</p>
        <p className="muted settings-data-copy">{authText.profileHint}</p>
        <button
          className="button secondary"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            setSignOutError(false);
            try {
              await onSignOut();
            } catch {
              setSignOutError(true);
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? authText.signingOut : authText.signOut}
        </button>
        {signOutError && (
          <p role="alert" className="form-error">
            {authText.save_error}
          </p>
        )}
      </section>
      <section className="life-card">
        <h2>{l.profile}</h2>
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            update((d) => ({ ...d, name: name.trim() }));
            setSaved(true);
          }}
        >
          <label>
            {l.displayName}
            <input
              value={name}
              maxLength={40}
              required
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <button className="button primary" disabled={!name.trim()}>
            {saved ? l.profileSaved : t.save}
          </button>
        </form>
      </section>
      <section className="life-card">
        <h2>{l.appearance}</h2>
        <div className="settings-row">
          <span>{l.appearance}</span>
          <div className="segmented">
            <button
              className={theme === 'light' ? 'selected' : ''}
              onClick={() => setTheme('light')}
            >
              {l.light}
            </button>
            <button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}>
              {l.dark}
            </button>
          </div>
        </div>
        <div className="settings-row">
          <span>{t.language}</span>
          <LanguageDropdown />
        </div>
      </section>
      <section className="life-card">
        <h2>{l.data}</h2>
        <p className="muted settings-data-copy">{authText.saved}</p>
        <div className="settings-buttons">
          <button className="button secondary" onClick={download}>
            <Download size={16} />
            {l.export}
          </button>
          <button className="button secondary" onClick={() => navigate('Goals')}>
            {l.goals}
          </button>
        </div>
      </section>
    </div>
  );
}
